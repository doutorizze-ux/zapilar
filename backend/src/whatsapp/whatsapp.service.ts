import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
    WASocket,
    proto,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';

import { ChatMessage } from './entities/chat-message.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';
import { LeadsService } from '../leads/leads.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(WhatsappService.name);
    private sessions: Map<string, WASocket> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private connectionStatuses: Map<string, 'CONNECTED' | 'DISCONNECTED' | 'QR_READY' | 'CONNECTING'> = new Map();

    // AI
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    // State Machine for Chat
    private userStates: Map<string, { mode: 'MENU' | 'WAITING_CAR_NAME' | 'WAITING_FAQ' | 'HANDOVER' }> = new Map();
    // Pause List
    private pausedUsers: Set<string> = new Set();

    private readonly SESSIONS_DIR = path.join(process.cwd(), 'whatsapp_sessions');

    constructor(
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService
    ) {
        if (!fs.existsSync(this.SESSIONS_DIR)) {
            fs.mkdirSync(this.SESSIONS_DIR, { recursive: true });
        }
    }

    async onModuleInit() {
        this.initializeAI();
        await this.restoreSessions();
        this.startInactivityCheck();
    }

    async onModuleDestroy() {
        this.logger.log('Shutting down WhatsApp sessions...');
        for (const [userId, socket] of this.sessions) {
            try {
                socket.end(undefined);
            } catch (e) {
                // ignore
            }
        }
    }

    private initializeAI() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(apiKey);
                this.model = this.genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
                this.logger.log('AI Initialized');
            } catch (e) {
                this.logger.error('Failed to init AI', e);
            }
        }
    }

    // --- Session Management ---

    private async restoreSessions() {
        try {
            const files = fs.readdirSync(this.SESSIONS_DIR);
            const userDirs = files.filter(f => fs.statSync(path.join(this.SESSIONS_DIR, f)).isDirectory() && f.startsWith('user_'));

            this.logger.log(`Found ${userDirs.length} existing sessions to restore.`);

            for (const dir of userDirs) {
                const userId = dir.replace('user_', '');
                this.logger.log(`Restoring session for user ${userId}...`);
                await this.createSession(userId);
            }
        } catch (e) {
            this.logger.error('Failed to restore sessions', e);
        }
    }

    async getSession(userId: string) {
        let status = this.connectionStatuses.get(userId) || 'DISCONNECTED';
        const socket = this.sessions.get(userId);

        // If disconnected and no socket, try to initialize (user trying to connect)
        if (!socket && status === 'DISCONNECTED') {
            await this.createSession(userId);
            status = 'CONNECTING'; // will update shortly
        }

        const qr = this.qrCodes.get(userId) || null;

        // Map native status to API response expected by frontend
        let finalStatus = status;
        if (status === 'CONNECTING') finalStatus = 'DISCONNECTED'; // Frontend might not handle CONNECTING

        return { status: finalStatus, qr };
    }

    async createSession(userId: string) {
        if (this.sessions.has(userId)) {
            return this.sessions.get(userId);
        }

        this.sessionStartTimes.set(userId, Date.now());
        this.connectionStatuses.set(userId, 'CONNECTING');
        const sessionPath = path.join(this.SESSIONS_DIR, `user_${userId}`);

        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }) as any,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }) as any),
            },
            browser: Browsers.macOS('Desktop'),
            connectTimeoutMs: 60000,
            retryRequestDelayMs: 2000,
        });

        this.sessions.set(userId, sock);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.logger.log(`QR Code generated for User ${userId}`);
                this.qrCodes.set(userId, qr);
                this.connectionStatuses.set(userId, 'QR_READY');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                this.logger.warn(`Connection closed for User ${userId}. Reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    this.connectionStatuses.set(userId, 'DISCONNECTED');
                    this.sessions.delete(userId);
                    // Add delay before reconnect to prevent loops
                    setTimeout(() => this.createSession(userId), 3000);
                } else {
                    this.connectionStatuses.set(userId, 'DISCONNECTED');
                    this.sessions.delete(userId);
                    this.qrCodes.delete(userId);
                    // Clean up files on logout?
                    try {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    } catch (e) {
                        this.logger.error(`Failed to remove session files for ${userId}`, e);
                    }
                }
            } else if (connection === 'open') {
                this.logger.log(`Connection opened for User ${userId}!`);
                this.connectionStatuses.set(userId, 'CONNECTED');
                this.qrCodes.delete(userId);
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                if (!msg.key?.remoteJid || msg.key.fromMe) continue;

                try {
                    await this.processIncomingMessage(userId, msg);
                } catch (e) {
                    this.logger.error(`Error processing message for user ${userId}`, e);
                }
            }
        });

        return sock;
    }

    // Interval to clean up inactive (stuck in QR) sessions
    private startInactivityCheck() {
        setInterval(() => {
            const now = Date.now();
            this.connectionStatuses.forEach((status, userId) => {
                // If QR has been waiting for > 10 minutes, clean it up
                if (status === 'QR_READY' || status === 'CONNECTING') {
                    // We need to track when it started. For simplicity, we can check if it has a QR and how old?
                    // Or just rely on the fact that if it's not CONNECTED in 10 mins, reset.
                    // A robust way: Map<userId, timestamp>
                    const started = this.sessionStartTimes.get(userId) || 0;
                    if (now - started > 600000 && started > 0) { // 10 mins
                        this.logger.log(`Session for ${userId} timed out (Inactive). Destroying.`);
                        this.deleteInstance(userId);
                    }
                }
            });
        }, 60000); // Check every minute
    }

    private sessionStartTimes: Map<string, number> = new Map();

    async deleteInstance(userId: string) {
        const sock = this.sessions.get(userId);
        if (sock) {
            try {
                await sock.logout();
            } catch (e) {
                // ignore
            }
            sock.end(undefined);
            this.sessions.delete(userId);
        }

        this.connectionStatuses.set(userId, 'DISCONNECTED');
        this.qrCodes.delete(userId);

        const sessionPath = path.join(this.SESSIONS_DIR, `user_${userId}`);
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    }

    // --- Message Processing ---

    private async processIncomingMessage(userId: string, msg: proto.IWebMessageInfo) {
        const jid = msg.key?.remoteJid;
        if (!jid) return;

        const from = jid;

        // Filter out Status Updates (Stories), Newsletters (Channels), and Groups
        if (jid.includes('status@broadcast') ||
            jid.includes('@newsletter') ||
            jid.includes('@g.us')) {
            return;
        }

        const name = msg.pushName || jid.split('@')[0];

        // Handling Text Content
        let text = '';
        if (msg.message?.conversation) text = msg.message.conversation;
        else if (msg.message?.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
        else if (msg.message?.imageMessage?.caption) text = msg.message.imageMessage.caption;

        if (!text) return; // Ignore non-text messages for now (audio, sticker, etc without caption)

        // Timestamp Check
        const msgTime = (typeof msg.messageTimestamp === 'number'
            ? msg.messageTimestamp
            : (msg.messageTimestamp as any).low) * 1000;

        const now = Date.now();
        // 2 Minutes Tolerance
        if (now - msgTime > 120000) {
            // this.logger.debug(`Ignoring old message from ${name} (${Math.round((now - msgTime)/1000)}s ago)`);
            return;
        }

        this.logger.log(`[Native] Msg from ${name}: ${text}`);

        // Log to DB
        await this.logMessage(userId, jid, jid, text, name, false, msg.key?.id || undefined);

        if (this.isBotPaused(userId)) return;

        // Auto-reply Logic
        await this.handleAutoReply(userId, jid, text, name);
    }

    private async handleAutoReply(userId: string, jid: string, text: string, name: string) {
        try {
            await this.leadsService.upsert(userId, jid, text, name);
        } catch (e) {
            // ignore
        }

        const msg = text.trim();
        const lowerMsg = msg.toLowerCase();

        // Retrieve Store Name
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "Loja";

        const stateKey = `${userId}:${jid}`;
        const currentState = this.userStates.get(stateKey)?.mode || 'MENU';
        const isFirstMessage = !this.userStates.has(stateKey);

        // Always allow breaking out of any state with 'menu'
        if (isFirstMessage || ['menu', 'início', 'inicio', 'voltar'].includes(lowerMsg)) {
            this.userStates.set(stateKey, { mode: 'MENU' });
            await this.sendMainMenu(userId, jid, storeName);
            return;
        }

        // If in HANDOVER mode, ignore everything (silence) unless it was the 'menu' command handled above
        if (currentState === 'HANDOVER') {
            return;
        }

        // State Machine
        if (currentState === 'MENU') {
            if (msg === '2') {
                await this.sendMessage(userId, jid, "Certo 👍. Um atendente foi notificado e responderá em breve!\n\n(🤖 O robô ficará em silêncio. Para me reativar, digite *Menu*)");
                this.userStates.set(stateKey, { mode: 'HANDOVER' });
            } else if (msg === '3') {
                this.userStates.set(stateKey, { mode: 'WAITING_FAQ' });
                await this.sendMessage(userId, jid, "Envie sua dúvida e eu responderei com base nas informações da loja 😉");
            } else {
                await this.handleCarSearch(userId, jid, msg, storeName);
            }
        } else if (currentState === 'WAITING_FAQ') {
            const answer = await this.faqService.findMatch(userId, msg);
            if (answer) {
                await this.sendMessage(userId, jid, answer);
                await this.sendMainMenu(userId, jid, storeName);
                this.userStates.set(stateKey, { mode: 'MENU' });
            } else {
                await this.sendMessage(userId, jid, "Ainda não tenho uma resposta para isso 😅. Digite *menu* para voltar ou pergunte outra coisa.");
            }
        }
    }

    private async sendMainMenu(userId: string, jid: string, storeName: string) {
        const menu = `👋 Olá! Bem-vindo(a) à *${storeName}*.\n
Estou aqui para te ajudar a encontrar seu carro novo! 🚘

🔍 *Deseja buscar um veículo?*
Digite o nome, marca ou modelo abaixo.
_Ex: Civic, Toro, S10_

━━━━━━━━━━━━━━━━

👇 *Ou escolha uma opção:*

2️⃣  Falar com um consultor
3️⃣  Dúvidas frequentes`;
        await this.sendMessage(userId, jid, menu);
    }

    private async handleCarSearch(userId: string, jid: string, query: string, storeName: string) {
        const allVehicles = await this.vehiclesService.findAll(userId);
        let found: any[] = [];

        if (query) {
            const q = query.toLowerCase();
            found = allVehicles.filter(v =>
                (v.name && v.name.toLowerCase().includes(q)) ||
                (v.model && v.model.toLowerCase().includes(q)) ||
                (v.brand && v.brand.toLowerCase().includes(q))
            );
        }

        if (found.length > 0) {
            const limit = 3;
            const cars: any[] = found;
            for (const car of cars.slice(0, limit)) {
                // Send Images
                if (car.images && car.images.length > 0) {
                    for (const img of car.images) {
                        await this.sendImage(userId, jid, this.resolveImageUrl(img));
                        await new Promise(r => setTimeout(r, 500));
                    }
                }

                // Send Details
                const price = Number(car.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

                const optionals: string[] = [];
                if (car.trava) optionals.push('Trava');
                if (car.alarme) optionals.push('Alarme');
                if (car.som) optionals.push('Som');
                if (car.teto) optionals.push('Teto Solar');
                if (car.banco_couro) optionals.push('Banco de Couro');

                let specs = `🚘 *${car.brand} ${car.name}*
📝 *Versão:* ${car.model || ''}
📅 *Ano:* ${car.year}
🛣️ *KM:* ${car.km}
🎨 *Cor:* ${car.color || 'Não inf.'}
💰 *R$ ${price}*

⚙️ *Especificações:*
${car.transmission || ''} | ${car.fuel || ''}`;

                if (optionals.length > 0) {
                    specs += `\n\n✨ *Opcionais:* \n${optionals.join(' | ')}`;
                }

                await this.sendMessage(userId, jid, specs);
                await new Promise(r => setTimeout(r, 800));
            }
            // Send Menu
            await this.sendMainMenu(userId, jid, storeName);
        } else {
            await this.sendMessage(userId, jid, "😕 Não encontrei esse modelo. Quer tentar outro nome?");
            await this.sendMainMenu(userId, jid, storeName);
        }
    }

    // --- Sending Methods ---

    async sendMessage(userId: string, to: string, text: string) {
        const sock = this.sessions.get(userId);
        if (!sock) {
            this.logger.warn(`Cannot send message. No session for user ${userId}`);
            return;
        }

        let jid = to;
        if (!jid.includes('@')) jid = `${jid.replace(/\D/g, '')}@s.whatsapp.net`;

        try {
            await sock.sendMessage(jid, { text });
            await this.logMessage(userId, jid, 'me', text, 'Atendente', true, undefined);
        } catch (e) {
            this.logger.error('Failed to send text message', e);
        }
    }

    async sendImage(userId: string, to: string, imageUrl: string, caption?: string) {
        const sock = this.sessions.get(userId);
        if (!sock) return;

        let jid = to;
        if (!jid.includes('@')) jid = `${jid.replace(/\D/g, '')}@s.whatsapp.net`;

        try {
            await sock.sendMessage(jid, {
                image: { url: imageUrl },
                caption: caption
            });
        } catch (e) {
            this.logger.error('Failed to send image', e);
        }
    }

    async sendManualMessage(userId: string, to: string, message: string) {
        await this.sendMessage(userId, to, message);
    }

    // --- Helpers ---

    private resolveImageUrl(imageUrl: string): string {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return imageUrl;

        // Localhost fallback
        const appUrl = this.configService.get('APP_URL') || `http://localhost:${process.env.PORT || 3000}`;
        if (!appUrl.endsWith('/') && !imageUrl.startsWith('/')) return `${appUrl}/${imageUrl}`;
        return `${appUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    isBotPaused(userId: string): boolean {
        return this.pausedUsers.has(userId);
    }

    setBotPaused(userId: string, paused: boolean) {
        if (paused) this.pausedUsers.add(userId);
        else this.pausedUsers.delete(userId);
        this.logger.log(`Bot for user ${userId} is now ${paused ? 'PAUSED' : 'ACTIVE'}`);
    }

    // Legacy Evolution support / DB Logging
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
                if (parts.length >= 2) body = parts.slice(1).join('|||');
                else body = chat.rawLastMessage;
            }
            return {
                id: chat.id,
                name: chat.customerName || chat.id,
                lastTime: chat.lastTime,
                lastMessage: body
            };
        });
    }

    // Stub for controller compatibility
    async handleWebhook(payload: any) {
        // No-op
    }

    // Stub for sync
    async syncSessions() {
        await this.restoreSessions();
    }
}
