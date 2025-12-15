import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { VehiclesService } from '../vehicles/vehicles.service';
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

    // Map<userId, qrCodeString>
    private qrCodes: Map<string, string> = new Map();
    // Map<userId, status>
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();

    // SAFETY: Default to ACTIVE. Only users in this set are ignored.
    private pausedUsers: Set<string> = new Set();
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    private evolutionUrl: string;
    private evolutionApiKey: string;

    setBotPaused(userId: string, paused: boolean) {
        if (paused) {
            this.pausedUsers.add(userId); // Add to paused list
        } else {
            this.pausedUsers.delete(userId); // Remove from paused list (Activate)
        }
        this.logger.log(`Bot for user ${userId} is now ${paused ? 'PAUSED' : 'ACTIVE'}`);
    }

    isBotPaused(userId: string): boolean {
        // If in paused list, it is PAUSED. Otherwise active.
        return this.pausedUsers.has(userId);
    }

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

    async onModuleInit() {
        this.evolutionUrl = this.configService.get<string>('EVOLUTION_API_URL') || 'http://localhost:8081';
        this.evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';
        this.initializeAI();

        // Start Polling for Messages (Brute Force Mode)
        this.logger.log('Starting Brute Force Polling...');
        // Start Polling for Messages (Backup Mode - Only if Webhook fails)
        this.logger.log('Starting Backup Polling (45s)...');
        setInterval(() => this.pollAllInstances(), 45000);

        // Sync existing sessions (recover from restart)
        await this.syncSessions();
    }

    // --- Polling Logic ---
    private async pollAllInstances() {
        for (const [userId, status] of this.statuses.entries()) {
            // STRICT CHECK: Only poll if explicit connected status
            if (status === 'CONNECTED') {
                await this.checkNewMessages(userId);
            }
        }
    }

    private processedMessageIds: Set<string> = new Set();

    private async checkNewMessages(userId: string) {
        // Double check status before heavy call
        if (this.statuses.get(userId) !== 'CONNECTED') return;

        const instanceName = this.getInstanceName(userId);
        try {
            // Check connection state via API to be sure (Sanity Check)
            const connectionState = await axios.get(`${this.evolutionUrl}/instance/connectionState/${instanceName}`, {
                headers: this.getHeaders()
            });

            if (connectionState.data?.instance?.state !== 'open') {
                if (connectionState.data?.instance?.state === 'close') {
                    this.statuses.set(userId, 'DISCONNECTED');
                }
                return;
            }

            const res = await axios.get(`${this.evolutionUrl}/chat/findChats/${instanceName}`, {
                headers: this.getHeaders()
            });
            const chats = res.data || [];

            // AGGRESSIVE POLLING: Check top 3 chats regardless of status
            for (const chat of chats.slice(0, 3)) {
                const remoteJid = chat.id;

                try {
                    const msgsRes = await axios.post(`${this.evolutionUrl}/chat/findMessages/${instanceName}`, {
                        where: { key: { remoteJid: remoteJid } },
                        options: { limit: 5 } // Fetch last 5 to be safe
                    }, { headers: this.getHeaders() });

                    const messages = (msgsRes.data || []).reverse();

                    for (const msg of messages) {
                        const msgId = msg.key?.id;
                        if (!msgId) continue;

                        // STRICT GUARD: Ignore messages sent by me (API or Mobile)
                        if (msg.key?.fromMe) continue;

                        if (this.processedMessageIds.has(msgId)) continue;

                        // DB DEDUPLICATION: Check if WAMID exists
                        const exists = await this.chatRepository.findOne({
                            where: { wamid: msgId }
                        });

                        if (exists) {
                            this.processedMessageIds.add(msgId);
                            continue;
                        }

                        this.processedMessageIds.add(msgId);

                        console.log(`[Polling] Processing NEW message: ${msgId} from ${remoteJid}`);

                        const payload = {
                            instance: instanceName,
                            type: 'MESSAGES_UPSERT',
                            data: msg
                        };

                        await this.handleWebhook(payload);
                    }
                } catch (innerErr) {
                    console.error(`[Polling] Error fetching msgs for ${remoteJid}:`, innerErr.message);
                }
            }

            if (this.processedMessageIds.size > 2000) this.processedMessageIds.clear();

        } catch (e) {
            console.error(`[Polling] Failed to find chats for ${instanceName}:`, e.message);
        }
    }

    private async syncSessions() {
        try {
            this.logger.log('Syncing sessions with Evolution API...');
            const res = await axios.get(`${this.evolutionUrl}/instance/fetch`, {
                headers: this.getHeaders()
            });

            const instances = res.data || [];
            // Evolution v1.8/v2 structure: array of objects
            for (const item of instances) {
                const instance = item.instance || item;
                const name = instance.instanceName || instance.name;
                const state = instance.state || instance.status;

                if (name && name.startsWith('store-') && state === 'open') {
                    const userId = name.replace('store-', '');
                    this.statuses.set(userId, 'CONNECTED');
                    this.logger.log(`Restored session for user ${userId}`);
                    // Ensure webhook is set for this session
                    this.ensureWebhook(userId);
                }
            }
        } catch (e) {
            this.logger.warn(`Failed to sync sessions on startup: ${e.message}`);
        }
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

    private async logMessage(storeId: string, contactId: string, from: string, body: string, senderName: string, isBot: boolean, wamid?: string) {
        try {
            await this.chatRepository.save({
                storeId,
                contactId,
                from,
                body,
                senderName,
                isBot,
                wamid
            });
        } catch (e) {
            this.logger.error('Failed to log message', e);
        }
    }

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

    // --- Evolution API Interactions ---

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.evolutionApiKey
        };
    }

    private getInstanceName(userId: string) {
        return `store-${userId}`;
    }

    async getSession(userId: string) {
        const instanceName = this.getInstanceName(userId);

        try {
            const stateRes = await axios.get(`${this.evolutionUrl}/instance/connectionState/${instanceName}`, {
                headers: this.getHeaders(),
                validateStatus: () => true
            });

            if (stateRes.status === 404) {
                await this.createInstance(userId);
                return { status: 'DISCONNECTED', qr: null };
            }

            const state = stateRes.data?.instance?.state || 'close';

            if (state === 'open') {
                this.statuses.set(userId, 'CONNECTED');
                await this.ensureWebhook(userId);
                return { status: 'CONNECTED', qr: null };
            } else if (state === 'connecting') {
                const qrRes = await axios.get(`${this.evolutionUrl}/instance/connect/${instanceName}`, {
                    headers: this.getHeaders()
                });
                if (qrRes.data?.code) {
                    this.statuses.set(userId, 'QR_READY');
                    this.qrCodes.set(userId, qrRes.data.code);
                    return { status: 'QR_READY', qr: qrRes.data.code };
                }
            }

            return { status: 'DISCONNECTED', qr: this.qrCodes.get(userId) || null };

        } catch (error) {
            this.logger.error(`Error checking session for ${userId}`, error);
            if (error.response?.status === 404) {
                await this.createInstance(userId);
            }
            return { status: 'DISCONNECTED', qr: null };
        }
    }

    private getEffectiveWebhookUrl(): string | undefined {
        const configuredUrl = this.configService.get<string>('WEBHOOK_URL');
        if (configuredUrl) {
            return configuredUrl;
        }

        // Fallback for local/dev auto-detection
        if (this.evolutionUrl.includes('evolution-api')) {
            const internalWebhook = 'http://backend:3000/whatsapp/webhook';
            return internalWebhook;
        }
        return undefined;
    }

    private async createInstance(userId: string) {
        const instanceName = this.getInstanceName(userId);
        try {
            this.logger.log(`Creating instance for ${userId}`);

            const webhookUrl = this.getEffectiveWebhookUrl();

            const payload = {
                instanceName: instanceName,
                token: instanceName,
                qrcode: true,
                webhook: webhookUrl,
                webhookUrl: webhookUrl,
            };

            await axios.post(`${this.evolutionUrl}/instance/create`, payload, { headers: this.getHeaders() });

            if (webhookUrl) {
                setTimeout(() => this.ensureWebhook(userId), 2000);
            }

        } catch (e) {
            this.logger.error(`Failed to create instance for ${userId}`, e.response?.data || e.message);
        }
    }

    async deleteInstance(userId: string) {
        const instanceName = this.getInstanceName(userId);
        try {
            this.logger.log(`Deleting instance for ${userId}`);
            await axios.delete(`${this.evolutionUrl}/instance/delete/${instanceName}`, { headers: this.getHeaders() });
            this.statuses.delete(userId);
            this.qrCodes.delete(userId);
        } catch (e) {
            this.logger.error(`Failed to delete instance for ${userId}`, e.response?.data || e.message);
        }
    }

    private async ensureWebhook(userId: string) {
        const instanceName = this.getInstanceName(userId);
        const webhookUrl = this.getEffectiveWebhookUrl();
        if (!webhookUrl) return;

        try {
            await axios.post(`${this.evolutionUrl}/webhook/set/${instanceName}`, {
                url: webhookUrl,
                webhook: webhookUrl,
                webhookUrl: webhookUrl,
                webhookByEvents: false,
                enabled: true
            }, { headers: this.getHeaders() });

            await this.configureSettings(instanceName);

        } catch (e) {
            this.logger.debug(`Failed to ensure webhook for ${userId}: ${e.message}`);
        }
    }

    private async configureSettings(instanceName: string) {
        try {
            await axios.post(`${this.evolutionUrl}/settings/set/${instanceName}`, {
                reject_call: false,
                groups_ignore: false,
                always_online: true,
                read_messages: true,
                read_status: false
            }, { headers: this.getHeaders() });
        } catch (e) {
            this.logger.warn(`Failed to configure settings for ${instanceName}`, e.message);
        }
    }

    // Helper to resolve Image URL for Docker/Local split
    // Helper to resolve Image URL for Docker/Local split
    private resolveImageUrl(imageUrl: string): string {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return imageUrl;

        // Try to get public URL first
        const webhookUrl = this.configService.get('WEBHOOK_URL'); // e.g., https://api.zapcar.com.br/whatsapp/webhook
        let baseUrl = '';

        if (webhookUrl) {
            // Remove /whatsapp/webhook to get root
            baseUrl = webhookUrl.replace('/whatsapp/webhook', '');
        } else {
            baseUrl = `http://localhost:${process.env.PORT || 3000}`;
        }

        // Docker internal adjustment (only if using localhost)
        if (baseUrl.includes('localhost') && this.evolutionUrl.includes('localhost')) {
            baseUrl = baseUrl.replace('localhost', 'host.docker.internal');
        }

        // Ensure no double slash issues
        if (!baseUrl.endsWith('/') && !imageUrl.startsWith('/')) {
            return `${baseUrl}/${imageUrl}`;
        } else if (baseUrl.endsWith('/') && imageUrl.startsWith('/')) {
            return `${baseUrl}${imageUrl.substring(1)}`;
        }

        return `${baseUrl}${imageUrl}`;
    }

    async sendMessage(userId: string, to: string, text: string) {
        const instanceName = this.getInstanceName(userId);
        let number = to.replace(/\D/g, '');

        try {
            await axios.post(`${this.evolutionUrl}/message/sendText/${instanceName}`, {
                number: number,
                options: { delay: 1200, presence: 'composing' },
                textMessage: { text: text }
            }, { headers: this.getHeaders() });
        } catch (e) {
            this.logger.error(`Failed to send message to ${to}`, e.response?.data || e.message);
        }
    }

    async sendImage(userId: string, to: string, imageUrl: string, caption?: string) {
        const instanceName = this.getInstanceName(userId);
        let number = to.replace(/\D/g, '');

        try {
            await axios.post(`${this.evolutionUrl}/message/sendMedia/${instanceName}`, {
                number: number,
                options: { delay: 1200, presence: 'composing' },
                mediaMessage: { mediatype: 'image', caption: caption, media: imageUrl }
            }, { headers: this.getHeaders() });
        } catch (e) {
            this.logger.error(`Failed to send image to ${to}`, e.response?.data || e.message);
        }
    }

    async sendManualMessage(userId: string, to: string, message: string) {
        await this.sendMessage(userId, to, message);
        this.logMessage(userId, to, 'me', message, 'Atendente', true);
    }

    async handleWebhook(payload: any) {
        this.logger.log(`[Webhook Receipt] Payload: ${JSON.stringify(payload)}`);
        const instanceName = payload.instance || payload.sender?.instanceId;

        if (!instanceName || !instanceName.startsWith('store-')) {
            return;
        }

        const userId = instanceName.replace('store-', '');
        const data = payload.data;
        const msgType = payload.type || payload.event;

        if (msgType !== 'MESSAGES_UPSERT' && msgType !== 'messages.upsert') {
            this.logger.debug(`Ignored webhook event type: ${msgType}`);
            return;
        }

        if (!data || !data.key) {
            this.logger.debug('Webhook data or key missing');
            return;
        }

        const fromMe = data.key.fromMe;
        const remoteJid = data.key.remoteJid;
        const cleanFrom = remoteJid.replace(/@s\.whatsapp\.net|@g\.us/g, '');

        let body = '';
        if (data.message?.conversation) {
            body = data.message.conversation;
        } else if (data.message?.extendedTextMessage?.text) {
            body = data.message.extendedTextMessage.text;
        } else if (data.message?.imageMessage?.caption) {
            body = data.message.imageMessage.caption;
        } else if (typeof data.message === 'string') {
            body = data.message;
        }

        if (!body) return;

        const pushName = data.pushName || cleanFrom;
        const messageTimestamp = data.messageTimestamp;
        const msgId = data.key?.id;

        await this.processIncomingMessage(userId, cleanFrom, pushName, body, fromMe, messageTimestamp, msgId);
    }

    private async processIncomingMessage(userId: string, from: string, senderName: string, text: string, isFromMe: boolean, messageTimestamp?: number, wamid?: string) {
        if (messageTimestamp) {
            let msgTime = 0;
            const ts = Number(messageTimestamp);
            if (ts > 9999999999) {
                msgTime = ts;
            } else {
                msgTime = ts * 1000;
            }

            const now = Date.now();
            const diff = now - msgTime;

            if (diff > 120000) {
                this.logger.debug(`[Ignored] Message is too old (${Math.round(diff / 1000)}s ago). Skipping.`);
                return;
            }
        }

        this.logger.log(`[DEBUG] Processing incoming msg. User: ${userId}, From: ${from}, Text: ${text}, FromMe: ${isFromMe}, WAMID: ${wamid}`);

        // Final Deduplication check before logic
        if (wamid) {
            const exists = await this.chatRepository.findOne({ where: { wamid } });
            if (exists) {
                this.logger.warn(`[Duplicate] Skipping already processed WAMID: ${wamid}`);
                return;
            }
        }

        await this.logMessage(userId, from, from, text, senderName, isFromMe, wamid);

        // Loop Guard
        if (isFromMe) {
            this.logger.log(`[Loop Guard] Ignoring update from myself/bot.`);
            return;
        }

        try {
            await this.leadsService.upsert(userId, from, text, senderName);
        } catch (e) {
            this.logger.error('Error tracking lead', e);
        }

        if (this.isBotPaused(userId)) {
            this.logger.log(`Bot paused for ${userId}, skipping auto-reply.`);
            return;
        }

        const msg = text.toLowerCase();
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";
        const allVehicles = await this.vehiclesService.findAll(userId);

        const strictMatchVehicles = allVehicles.filter(v => {
            const searchTerms = [v.name, v.brand, v.model, v.year?.toString()].map(t => t?.toLowerCase() || '');
            return searchTerms.some(term => term && term.length > 2 && msg.includes(term));
        });

        let contextVehicles = strictMatchVehicles;
        // Explicitly handle "Stock" request to populate contextVehicles for the AI/Sender
        if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catálogo') || msg.includes('ver carros')) {
            contextVehicles = allVehicles;
        }

        // Optimizing Context: Limit to 20 vehicles to prevent AI timeouts/hallucinations
        let aiContextVehicles = allVehicles.length > 20 ? allVehicles.slice(0, 20) : allVehicles;

        let shouldShowCars = false;
        let responseText = '';

        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];
            if (greetings.some(g => msg === g || (msg.includes(g) && msg.length < 10))) {
                shouldShowCars = false;
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver tudo.`;
            }

            if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
                shouldShowCars = false;
                return `📍 Estamos localizados em: [Endereço da Loja].\nVenha nos visitar!`;
            }

            if (strictMatchVehicles.length > 0) {
                contextVehicles = strictMatchVehicles;
                shouldShowCars = true;
                return `Encontrei ${strictMatchVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
            }

            if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catálogo')) {
                contextVehicles = allVehicles.slice(0, 5);
                shouldShowCars = true;
                return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
            }

            shouldShowCars = false;
            return `Poxa, procurei aqui e não encontrei nenhum carro com nome *"${text}"* no momento. 😕\n\nMas temos muitas outras opções! Digite *Estoque* para ver o que chegou.`;
        };

        const faqMatch = await this.faqService.findMatch(userId, msg);

        if (faqMatch) {
            responseText = faqMatch;
            shouldShowCars = false;
        } else if (this.model) {
            try {
                const params = aiContextVehicles.map(v => `- ${v.brand} ${v.name} ${v.model} (${v.year})`).join('\n');
                const prompt = `
                Você é um consultor de vendas especialista da loja "${storeName}".
                ** Contexto **
                Mensagem do Cliente: "${text}"
                ** Estoque Atual **
                ${params}
                
                ** Missão **
                Identificar se o cliente está buscando um carro específico ou quer ver o estoque geral.
                
                ** Regras RÍGIDAS **
                1. Se o cliente pedir um carro específico (ex: "tem civic?"):
                   - Verifique se ele está no **Estoque Atual** acima.
                   - Se SIM: Responda confirmando e use a flag [SHOW_CARS].
                   - Se NÃO: Responda apenas que não tem o modelo no momento. NUNCA ofereça outros modelos ("não temos X mas temos Y"). Use a flag [NO_CARS].
                2. Se o cliente pedir para ver o estoque geral (ex: "quais carros tem?", "ver catálogo", "estoque"):
                   - Responda que vai mostrar as opções. Use a flag [SHOW_CARS].
                3. Se for apenas um cumprimento ou perguntas gerais:
                   - Responda cordialmente. [NO_CARS].
                4. Pergunta sobre endereço/localização:
                    - Responda com o endereço da loja. [NO_CARS].
                
                Retorne apenas a resposta do bot seguida da flag [SHOW_CARS] ou [NO_CARS].
                `;

                const result = await this.model.generateContent(prompt);
                const aiResponse = result.response.text();

                if (aiResponse.includes('[SHOW_CARS]')) shouldShowCars = true;
                responseText = aiResponse.replace(/\[SHOW_CARS\]|\[NO_CARS\]/g, '').trim();

            } catch (error) {
                this.logger.error('AI Failed', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }

        await this.sendMessage(userId, from, responseText);
        this.logMessage(userId, from, 'bot', responseText, storeName + ' (Bot)', true);

        if (shouldShowCars && contextVehicles.length > 0) {
            // STRICT MODE: Only show context vehicles. NEVER fall back to random generic list if specific search failed.
            const vehiclesToShow = contextVehicles;

            for (const car of vehiclesToShow.slice(0, 5)) {
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

                await this.sendMessage(userId, from, specs);
                this.logMessage(userId, from, 'bot', specs, storeName + ' (Bot)', true);

                const delay = (ms) => new Promise(r => setTimeout(r, ms));
                await delay(800);

                if (car.images && car.images.length > 0) {
                    for (const imageUrl of car.images.slice(0, 4)) {
                        if (!imageUrl) continue;

                        const finalUrl = this.resolveImageUrl(imageUrl);
                        this.logger.debug(`[Sending Image] Car: ${car.name}, URL: ${finalUrl}`);

                        await this.sendImage(userId, from, finalUrl, car.name);
                        await delay(1500);
                    }
                }

                await this.sendMessage(userId, from, '--------------------------------');
                await delay(500);
            }
        }
    }
}
