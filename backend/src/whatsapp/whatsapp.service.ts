
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    proto,
    Browsers
} from '@whiskeysockets/baileys';
import pino from 'pino';
import * as fs from 'fs';
import * as path from 'path';

import { VehiclesService } from '../vehicles/vehicles.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { ChatMessage } from './entities/chat-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';
import { LeadsService } from '../leads/leads.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class WhatsappService implements OnModuleInit {
    private readonly logger = new Logger(WhatsappService.name);

    // Map<userId, Socket>
    private clients: Map<string, any> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private pausedUsers: Set<string> = new Set();

    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService,
        private chatGateway: ChatGateway
    ) { }

    setBotPaused(userId: string, paused: boolean) {
        if (paused) {
            this.pausedUsers.add(userId);
        } else {
            this.pausedUsers.delete(userId);
        }
        this.logger.log(`Bot for user ${userId} is now ${paused ? 'PAUSED' : 'ACTIVE'}`);
    }

    isBotPaused(userId: string): boolean {
        return this.pausedUsers.has(userId);
    }

    onModuleInit() {
        this.initializeAI();
        this.restoreSessions();
    }

    private initializeAI() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        } else {
            this.logger.warn('GEMINI_API_KEY not found. AI features disabled.');
        }
    }

    async getSession(userId: string) {
        if (!this.clients.has(userId)) {
            await this.initializeClient(userId);
        }

        return {
            status: this.statuses.get(userId) || 'DISCONNECTED',
            qr: this.qrCodes.get(userId) || null
        };
    }

    // Helper to fetch history
    async getChatHistory(storeId: string, contactId: string) {
        return this.chatRepository.find({
            where: { storeId, contactId },
            order: { createdAt: 'ASC' }
        });
    }

    async getRecentChats(storeId: string) {
        const rawChats = await this.chatRepository
            .createQueryBuilder("msg")
            .select("msg.contactId", "id")
            .addSelect("MAX(CASE WHEN msg.isBot = 0 AND msg.from != 'me' THEN msg.senderName ELSE NULL END)", "customerName")
            .addSelect("MAX(msg.createdAt)", "lastTime")
            .addSelect("MAX(CONCAT(msg.createdAt, '|||', msg.body))", "rawLastMessage")
            .where("msg.storeId = :storeId", { storeId })
            .groupBy("msg.contactId")
            .orderBy("lastTime", "DESC")
            .getRawMany();

        return rawChats.map(chat => {
            let body = '';
            if (chat.rawLastMessage) {
                const parts = chat.rawLastMessage.split('|||');
                if (parts.length >= 2) {
                    body = parts.slice(1).join('|||');
                } else {
                    body = chat.rawLastMessage;
                }
            }

            return {
                id: chat.id,
                name: chat.customerName || chat.id,
                lastTime: chat.lastTime,
                lastMessage: body
            };
        });
    }

    private async restoreSessions() {
        this.logger.log('[Session Restore] Starting session restoration...');
        const sessionsDir = path.join(process.cwd(), '.baileys_auth');

        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
            this.logger.log('[Session Restore] Created sessions directory.');
            return;
        }

        const files = fs.readdirSync(sessionsDir);
        // Expecting folders like 'session-userId'
        const usersToRestore = new Set<string>();

        for (const file of files) {
            if (file.startsWith('session-')) {
                const userId = file.replace('session-', '');
                usersToRestore.add(userId);
            }
        }

        for (const userId of usersToRestore) {
            this.logger.log(`[Session Restore] Restoring session for user: ${userId}`);
            await this.initializeClient(userId);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    private async initializeClient(userId: string) {
        if (this.clients.has(userId)) return;

        this.logger.log(`Initializing Baileys Socket for User: ${userId}`);
        const sessionPath = path.join(process.cwd(), '.baileys_auth', `session-${userId}`);

        try {
            // Ensure directory exists
            if (!fs.existsSync(sessionPath)) {
                fs.mkdirSync(sessionPath, { recursive: true });
            }

            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
            // const { version } = await fetchLatestBaileysVersion(); // Can be flaky

            const sock = makeWASocket({
                logger: pino({ level: 'silent' }) as any,
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }) as any),
                },
                syncFullHistory: false,
                generateHighQualityLinkPreview: true,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
            });

            this.clients.set(userId, sock);
            this.statuses.set(userId, 'DISCONNECTED');

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    this.logger.log(`QR Code received for ${userId}`);
                    this.qrCodes.set(userId, qr);
                    this.statuses.set(userId, 'QR_READY');
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                    this.logger.warn(`Connection closed for ${userId} due to ${lastDisconnect?.error}, reconnecting: ${shouldReconnect}`);

                    this.statuses.set(userId, 'DISCONNECTED');
                    this.qrCodes.delete(userId);

                    if (shouldReconnect) {
                        // Retry with increased delay
                        setTimeout(() => this.initializeClient(userId), 5000);
                    } else {
                        this.logger.log(`User ${userId} logged out.`);
                        this.clients.delete(userId);

                        // Clean up session folder
                        try {
                            const sessionDir = path.join(process.cwd(), '.baileys_auth', `session-${userId}`);
                            if (fs.existsSync(sessionDir)) {
                                fs.rmSync(sessionDir, { recursive: true, force: true });
                            }
                        } catch (e) {
                            this.logger.error(`Error cleaning up session for ${userId}`, e);
                        }
                    }
                } else if (connection === 'open') {
                    this.logger.log(`Connection opened for ${userId}`);
                    this.statuses.set(userId, 'CONNECTED');
                    this.qrCodes.delete(userId);
                }
            });

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;

                try {
                    for (const msg of m.messages) {
                        if (!msg.message) continue;
                        await this.handleMessage(userId, msg, sock);
                    }
                } catch (e) {
                    this.logger.error('Error processing message upsert', e);
                }
            });

        } catch (error) {
            this.logger.error(`Failed to initialize client for ${userId}`, error);
            // Don't throw, just log so the endpoint returns whatever status it has (DISCONNECTED)
        }
    }

    async sendManualMessage(userId: string, to: string, message: string) {
        const sock = this.clients.get(userId);
        if (!sock) {
            throw new Error('Client not ready. Please wait a moment and try again.');
        }

        // Format JID
        const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });

        // Log manual message
        const cleanTo = jid.replace(/@s\.whatsapp\.net|@g\.us/, '');
        this.logMessage(userId, cleanTo, 'me', message, 'Atendente', true);

        // Emit to frontend
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'manual-' + Date.now(),
            from: 'me',
            body: message,
            timestamp: Date.now() / 1000,
            senderName: 'Atendente',
            isBot: true
        });
    }

    private async handleMessage(userId: string, msg: proto.IWebMessageInfo, sock: any) {
        if (!msg.key || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid) return;

        const cleanFrom = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '');
        const pushName = msg.pushName || cleanFrom;

        if (!msg.message) return;

        // Extract text body correctly from various message types
        const text = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

        if (!text) return; // Skip non-text messages for now (audio, stickers?)

        // 0. Log & Emit
        this.logMessage(userId, cleanFrom, cleanFrom, text, pushName, false);

        this.chatGateway.emitMessageToRoom(userId, {
            id: msg.key.id || 'unknown',
            from: cleanFrom,
            body: text,
            timestamp: (msg.messageTimestamp as number) || Date.now() / 1000,
            senderName: pushName,
            isBot: false
        });

        // 1. Lead Tracking
        try {
            await this.leadsService.upsert(userId, cleanFrom, text, pushName);
        } catch (e) {
            this.logger.error('Error tracking lead', e);
        }

        // Check Pause
        if (this.isBotPaused(userId)) {
            return;
        }

        // 2. Bot Logic
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";
        const allVehicles = await this.vehiclesService.findAll(userId);

        const aiContextVehicles = allVehicles.slice(0, 50); // Limit context

        let responseText = '';
        let shouldShowCars = false;
        let contextVehicles: Vehicle[] = [];

        // Simple strict match filter logic re-use
        const strictMatchVehicles = allVehicles.filter(v => {
            const searchTerms = [v.name, v.brand, v.model, v.year?.toString()].map(t => t?.toLowerCase() || '');
            const lowerMsg = text.toLowerCase();
            return searchTerms.some(term => term && term.length > 2 && lowerMsg.includes(term));
        });

        // Fallback Logic
        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];
            const lowerMsg = text.toLowerCase();

            if (greetings.some(g => lowerMsg === g || (lowerMsg.includes(g) && lowerMsg.length < 10))) {
                shouldShowCars = false;
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver tudo.`;
            }

            if (lowerMsg.includes('endereço') || lowerMsg.includes('local') || lowerMsg.includes('onde fica')) {
                shouldShowCars = false;
                return `📍 Estamos localizados em: [Endereço da Loja].\nVenha nos visitar!`;
            }

            if (strictMatchVehicles.length > 0) {
                contextVehicles = strictMatchVehicles;
                shouldShowCars = true;
                return `Encontrei ${strictMatchVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
            }

            if (lowerMsg.includes('estoque') || lowerMsg.includes('catalogo')) {
                contextVehicles = allVehicles.slice(0, 5);
                shouldShowCars = true;
                return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
            }

            shouldShowCars = false;
            return `Poxa, procurei aqui e não encontrei nenhum carro com nome *"${text}"* no momento. 😕\n\nMas temos muitas outras opções! Digite *Estoque* para ver o que chegou.`;
        };

        const faqMatch = await this.faqService.findMatch(userId, text);

        if (faqMatch) {
            responseText = faqMatch;
            shouldShowCars = false;
        } else if (this.model) {
            try {
                // AI uses the BROAD list
                const params = aiContextVehicles.map(v =>
                    `- ${v.brand} ${v.name} ${v.model} (${v.year})`
                ).join('\n');

                const prompt = `
                Você é um consultor de vendas especialista da loja "${storeName}".
                
                ** Contexto **
                Mensagem do Cliente: "${text}"
                
                ** Estoque Atual (Lista Completa) **
                ${params}
                (Se a lista estiver vazia, não temos carros no momento).

                ** Missão **
                Identificar se o cliente está buscando um carro específico que temos no estoque, mesmo que ele tenha digitado errado (ex: "corola" -> Corolla, "hylux" -> Hilux).
                
                ** Regras de Resposta **
                1. Mantenha um tom profissional, amigável e direto. Use emojis moderadamente.
                2. LEITURA DE INTENÇÃO:
                   - SAUDAÇÃO (Oi, Olá): Responda apenas com cordialidade. Use [NO_CARS].
                   - BUSCA ESPECÍFICA: Se o cliente pediu explicitamente um carro
                     - DEU MATCH: Responda "Tenho sim! Aqui estão os detalhes:" e use [SHOW_CARS].
                     - NÃO DEU MATCH: Responda "Poxa, esse modelo exato eu não tenho agora. Mas tenho outras opções!" e use [NO_CARS].
                   - CURIOSIDADE ("Quero ver o estoque"): Responda "Claro! Separei uns destaques:" e use [SHOW_CARS].
                   
                ** CONTROLE FINAL **
                Se encontrar o carro no contexto, use [SHOW_CARS]. Se não, use [NO_CARS].

                ** Retorne apenas a resposta do bot seguida da flag. **
                `;

                const result = await this.model.generateContent(prompt);
                const aiResponse = result.response.text();

                if (aiResponse.includes('[SHOW_CARS]')) {
                    shouldShowCars = true;
                    // Try to guess context vehicles via strict match again or just show top 5 if generic
                    if (strictMatchVehicles.length > 0) {
                        contextVehicles = strictMatchVehicles;
                    } else {
                        // AI found something but strict didn't? Maybe fuzzy match? 
                        // For safety, show top items or all
                        contextVehicles = aiContextVehicles;
                    }
                } else {
                    shouldShowCars = false;
                }

                responseText = aiResponse.replace(/\[SHOW_CARS\]|\[NO_CARS\]/g, '').trim();

            } catch (error) {
                this.logger.error('AI Failed', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }

        // Send Reply
        await sock.sendMessage(remoteJid, { text: responseText });

        this.logMessage(userId, cleanFrom, 'bot', responseText, storeName + ' (Bot)', true);

        this.chatGateway.emitMessageToRoom(userId, {
            id: 'bot-' + Date.now(),
            from: 'bot',
            body: responseText,
            timestamp: Date.now() / 1000,
            senderName: storeName + ' (Bot)',
            isBot: true
        });

        // Send Cars if needed
        if (shouldShowCars && contextVehicles.length > 0) {
            const vehiclesToShow = contextVehicles.slice(0, 5);
            for (const car of vehiclesToShow) {
                const features: string[] = [];
                if (car.trava) features.push('Trava');
                if (car.alarme) features.push('Alarme');
                if (car.som) features.push('Som');
                if (car.teto) features.push('Teto Solar');
                if (car.banco_couro) features.push('Banco de Couro');

                const featuresText = features.length > 0 ? `✨ Opcionais: ${features.join(', ')}\n` : '';

                const specs = `🔹 *${car.brand} ${car.name}* ${car.model || ''}
📅 Ano: ${car.year} | 🚦 Km: ${car.km || 'N/A'}
⛽ Combustível: ${car.fuel} | ⚙️ Câmbio: ${car.transmission}
🎨 Cor: ${car.color}
${featuresText}💰 *R$ ${Number(car.price).toLocaleString('pt-BR')}*

_Gostou deste? Digite_ *"Quero o ${car.name} ${car.year}"*`;

                // Send Specs
                await sock.sendMessage(remoteJid, { text: specs });

                // Track history
                this.logMessage(userId, cleanFrom, 'bot', specs, storeName + ' (Bot)', true);

                // Send Images
                if (car.images && car.images.length > 0) {
                    const imagesToSend = car.images.slice(0, 4);
                    for (const imageUrl of imagesToSend) {
                        try {
                            if (!imageUrl) continue;
                            let finalUrl = imageUrl;
                            if (imageUrl.startsWith('/')) {
                                const port = process.env.PORT || 3000;
                                // Assuming localhost for now, but in prod this might need full URL
                                finalUrl = `http://localhost:${port}${imageUrl}`;
                                // Note: Baileys needs accessible URL or Buffer. 
                                // If local file, might need to read it.
                                // If http localhost, might fail if docker container can't see 'localhost' of host?
                                // Actually, if it's the same container/network, use localhost:3000
                            }

                            if (finalUrl.startsWith('http')) {
                                await sock.sendMessage(remoteJid, {
                                    image: { url: finalUrl }
                                });
                            }
                        } catch (e) {
                            this.logger.error(`Failed to send image for ${car.name}`, e);
                        }
                    }
                }

                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    async resetSession(userId: string) {
        this.logger.warn(`Resetting session for user ${userId}...`);

        // 1. Disconnect current socket if exists
        const sock = this.clients.get(userId);
        if (sock) {
            try {
                sock.end(new Error('Session Reset'));
            } catch (e) { }
            this.clients.delete(userId);
        }

        // 2. Clear clean states
        this.statuses.delete(userId);
        this.qrCodes.delete(userId);

        // 3. Delete Session Files
        const sessionPath = path.join(process.cwd(), '.baileys_auth', `session-${userId}`);
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                this.logger.log(`Deleted session files for ${userId}`);
            } catch (e) {
                this.logger.error(`Failed to delete session files: ${e.message}`);
            }
        }

        // 4. Re-initialize
        // Wait a bit to ensure file system release
        setTimeout(() => this.initializeClient(userId), 1000); // 

        return { success: true };
    }

    private async logMessage(storeId: string, contactId: string, from: string, body: string, senderName: string, isBot: boolean) {
        try {
            await this.chatRepository.save({
                storeId,
                contactId,
                from,
                body,
                senderName,
                isBot
            });
        } catch (e) {
            this.logger.error('Failed to log message', e);
        }
    }
}
