
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
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
    // Map<userId, Client>
    private clients: Map<string, Client> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private pausedUsers: Set<string> = new Set(); // New: Memory-based pause state
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    setBotPaused(userId: string, paused: boolean) {
        if (paused) {
            this.pausedUsers.add(userId);
        } else {
            this.pausedUsers.delete(userId);
        }
        console.log(`Bot for user ${userId} is now ${paused ? 'PAUSED' : 'ACTIVE'}`);
    }

    isBotPaused(userId: string): boolean {
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

    // Helper to log message
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
            console.error('Failed to log message', e);
        }
    }

    // Helper to fetch history
    async getChatHistory(storeId: string, contactId: string) {
        return this.chatRepository.find({
            where: { storeId, contactId },
            order: { createdAt: 'ASC' }
        });
    }

    async getRecentChats(storeId: string) {
        // Fetch distinct contacts from message history
        // Since we can't easily do DISTINCT ON in generic SQL via TypeORM simple find, we use query builder
        return this.chatRepository
            .createQueryBuilder("msg")
            .select("msg.contactId", "id")
            .addSelect("MAX(msg.senderName)", "name") // basic guess for name
            .addSelect("MAX(msg.createdAt)", "lastTime") // most recent time
            .addSelect("SUBSTRING(MAX(CONCAT(msg.createdAt, '|||', msg.body)), 25)", "lastMessage") // trick to get last message content
            .where("msg.storeId = :storeId", { storeId })
            .groupBy("msg.contactId")
            .orderBy("lastTime", "DESC") // Cannot use alias in older SQL sometimes, but usually fine
            .getRawMany();
    }

    onModuleInit() {
        this.initializeAI();
        this.cleanSimulationData();
    }

    private async cleanSimulationData() {
        try {
            await this.chatRepository.delete({ contactId: '5511999999999' });
            await this.chatRepository.delete({ contactId: '5511999999999@c.us' });
            console.log('Cleaned up simulation data artifacts.');
        } catch (e) {
            console.error('Failed to cleanup sim data', e);
        }
    }

    private initializeAI() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        } else {
            console.warn('GEMINI_API_KEY not found. AI features disabled.');
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

    private async initializeClient(userId: string) {
        console.log(`Initializing WhatsApp Client for User: ${userId}`);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: `store-${userId}`
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.clients.set(userId, client);
        this.statuses.set(userId, 'DISCONNECTED');

        client.on('qr', (qr) => {
            console.log(`QR RECEIVED caused by ${userId}`);
            this.qrCodes.set(userId, qr);
            this.statuses.set(userId, 'QR_READY');
        });

        client.on('ready', () => {
            console.log(`WhatsApp Client for ${userId} is ready!`);
            this.statuses.set(userId, 'CONNECTED');
            this.qrCodes.delete(userId);
        });

        client.on('disconnected', () => {
            console.log(`Client ${userId} disconnected`);
            this.statuses.set(userId, 'DISCONNECTED');
            this.qrCodes.delete(userId);
            this.clients.delete(userId); // Cleanup
        });

        client.on('message', async (message: Message) => {
            await this.handleMessage(message, userId);
        });

        try {
            await client.initialize();
        } catch (e) {
            console.error(`Failed to initialize client for ${userId}`, e);
        }
    }

    async sendManualMessage(userId: string, to: string, message: string) {
        const client = this.clients.get(userId);
        if (!client) {
            throw new Error('WhatsApp client not connected');
        }

        // Ensure number formatting (remove non-digits, add suffixes if needed)
        // whatsapp-web.js usually expects '556299999999@c.us'
        let chatId = to;
        if (!chatId.includes('@c.us')) {
            chatId = `${chatId.replace(/\D/g, '')}@c.us`;
        }

        await client.sendMessage(chatId, message);

        // Log manual message
        this.logMessage(userId, to, 'me', message, 'Atendente', true);

        // Emit to frontend so it appears in the chat UI immediately as 'me'
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'manual-' + Date.now(),
            from: 'me',
            body: message,
            timestamp: Date.now() / 1000,
            senderName: 'Atendente',
            isBot: true // or create a new flag isAgent? For now re-use isBot or check sender
        });
    }

    private async handleMessage(message: Message, userId: string) {
        // 0. Emit Incoming Message to Live Chat
        try {
            const contact = await message.getContact();
            const contactName = contact.pushname || contact.name || message.from;

            // Log incoming
            this.logMessage(userId, message.from, message.from, message.body, contactName, false);

            this.chatGateway.emitMessageToRoom(userId, {
                id: message.id.id,
                from: message.from,
                body: message.body,
                timestamp: message.timestamp,
                senderName: contactName,
                isBot: false // Sent by customer
            });
        } catch (e) { console.error('Error emitting socket msg', e); }

        const msg = message.body.toLowerCase();

        try {
            const contact = await message.getContact();
            await this.leadsService.upsert(userId, message.from, message.body, contact.pushname || contact.name);
        } catch (e) {
            console.error('Error tracking lead', e);
        }

        // Check if Bot is Paused for this user
        if (this.isBotPaused(userId)) {
            console.log(`Bot paused for ${userId}, skipping auto-reply.`);
            return;
        }

        // 1. Get User Context
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";

        // 2. Prepare Context
        const allVehicles = await this.vehiclesService.findAll(userId);

        // Strict Search for Fallback (classic logic)
        const strictMatchVehicles = allVehicles.filter(v => {
            const searchTerms = [v.name, v.brand, v.model, v.year?.toString()].map(t => t?.toLowerCase() || '');
            return searchTerms.some(term => term && term.length > 2 && msg.includes(term));
        });

        // This variable is used by Fallback and Display logic
        let contextVehicles = strictMatchVehicles;

        // Context for AI (Broad - up to 50 items to allow fuzzy matching)
        let aiContextVehicles = allVehicles;
        if (aiContextVehicles.length > 50) {
            aiContextVehicles = aiContextVehicles.slice(0, 50);
        }

        const ignoreTerms = ['bom', 'boa', 'tarde', 'noite', 'dia', 'ola', 'olá', 'tudo', 'bem', 'sim', 'não', 'quero'];
        const isGeneric = ignoreTerms.includes(msg) || msg.length <= 3;

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        let shouldShowCars = false;
        let responseText = '';

        // 3. Fallback Logic Helper
        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];

            // Greeting handling
            if (greetings.some(g => msg === g || (msg.includes(g) && msg.length < 10))) {
                shouldShowCars = false;
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver tudo.`;
            }

            if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
                shouldShowCars = false;
                return `📍 Estamos localizados em: [Endereço da Loja].\nVenha nos visitar!`;
            }

            // Use Strict Matches (so we don't spam random cars if simple keyword match fails)
            if (strictMatchVehicles.length > 0) {
                // If we have strict matches, use them
                contextVehicles = strictMatchVehicles;
                shouldShowCars = true;
                return `Encontrei ${strictMatchVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
            }

            if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catálogo')) {
                // Show top 5 recent
                contextVehicles = allVehicles.slice(0, 5);
                shouldShowCars = true;
                return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
            }

            shouldShowCars = false;
            // Improved "Not Found" message
            return `Poxa, procurei aqui e não encontrei nenhum carro com nome *"${message.body}"* no momento. 😕\n\nMas temos muitas outras opções! Digite *Estoque* para ver o que chegou.`;
        };

        // 4. Try FAQ Match First
        const faqMatch = await this.faqService.findMatch(userId, msg);



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
                Mensagem do Cliente: "${message.body}"
                
                ** Estoque Atual (Lista Completa) **
                ${params}
                (Se a lista estiver vazia, não temos carros no momento).

                ** Missão **
                Identificar se o cliente está buscando um carro específico que temos no estoque, mesmo que ele tenha digitado errado (ex: "corola" -> Corolla, "hylux" -> Hilux).
                
                ** Regras de Resposta **
                1. Mantenha um tom profissional, amigável e direto. Use emojis moderadamente.
                2. LEITURA DE INTENÇÃO:
                   ** REGRAS DE COMPORTAMENTO **
                   - SAUDAÇÃO (Oi, Olá, Tudo bem?): Responda apenas com cordialidade e pergunte qual modelo a pessoa procura. JAMAIS mostre lista de carros na saudação. Use a flag [NO_CARS].
                   - BUSCA ESPECÍFICA: Se o cliente pediu explicitamente um carro (ex: "tem hilux?", "busco civic"), procure na lista acima.
                     - DEU MATCH: Responda "Tenho sim! Aqui estão os detalhes:" e use a flag [SHOW_CARS].
                     - NÃO DEU MATCH: Responda "Poxa, esse modelo exato eu não tenho agora. 😕 Mas tenho outras opções incríveis! Quer dar uma olhada no estoque?" e use a flag [NO_CARS] (só mostre se ele disser sim depois).
                   - CURIOSIDADE ("Quero ver o estoque", "O que você tem?"): Responda "Claro! Separei uns destaques:" e use a flag [SHOW_CARS].
                   
                ** CONTROLE DE FLUXO (CRÍTICO) **
                - Se for só "Oi" ou "Olá": Use [NO_CARS]
                - Se perguntou preço de um carro da lista: Use [SHOW_CARS]
                - Se o cliente não pediu carro nenhum: Use [NO_CARS]

                ** Retorne apenas a resposta do bot seguida da flag. **
                `;

                const result = await this.model.generateContent(prompt);
                const aiResponse = result.response.text();

                // Explicitly check for SHOW_CARS, default to false logic essentially
                if (aiResponse.includes('[SHOW_CARS]')) {
                    shouldShowCars = true;
                } else {
                    shouldShowCars = false;
                }

                responseText = aiResponse.replace(/\[SHOW_CARS\]|\[NO_CARS\]/g, '').trim();

            } catch (error) {
                console.error('AI Failed, using fallback strategy', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }

        // 5. Reply with Text
        await message.reply(responseText);

        // Log Bot Reply
        this.logMessage(userId, message.from, 'bot', responseText, storeName + ' (Bot)', true);

        // 5.5 Emit Bot Response to Live Chat
        this.chatGateway.emitMessageToRoom(userId, {
            id: 'bot-' + Date.now(),
            from: 'bot',
            body: responseText,
            timestamp: Date.now() / 1000,
            senderName: storeName + ' (Bot)',
            isBot: true
        });

        // 6. Send Cars (Card + Images) Only if decided
        const client = this.clients.get(userId);
        if (!client || !shouldShowCars) return;

        let vehiclesToShow = contextVehicles;
        if (vehiclesToShow.length === 0) {
            vehiclesToShow = allVehicles.slice(0, 3);
        }

        if (vehiclesToShow.length > 0) {
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

                await client.sendMessage(message.from, specs);

                // Emit Car Specs to Chat
                // Emit Car Specs to Chat
                this.chatGateway.emitMessageToRoom(userId, {
                    id: 'bot-car-' + car.id,
                    from: 'bot',
                    body: specs,
                    timestamp: Date.now() / 1000,
                    senderName: storeName + ' (Bot)',
                    isBot: true
                });

                // Log Car Specs Sent
                this.logMessage(userId, message.from, 'bot', specs, storeName + ' (Bot)', true);

                await delay(800);

                if (car.images && car.images.length > 0) {
                    const imagesToSend = car.images.slice(0, 4);
                    for (const imageUrl of imagesToSend) {
                        try {
                            if (!imageUrl) continue;
                            let finalUrl = imageUrl;
                            if (imageUrl.startsWith('/')) {
                                const port = process.env.PORT || 3000;
                                finalUrl = `http://localhost:${port}${imageUrl}`;
                            }
                            if (finalUrl.startsWith('http')) {
                                const media = await MessageMedia.fromUrl(finalUrl);
                                await client.sendMessage(message.from, media);
                                await delay(1000);
                            }
                        } catch (e) {
                            console.error(`Failed to send image for ${car.name}:`, e);
                        }
                    }
                }

                await delay(1500);
                await client.sendMessage(message.from, '--------------------------------');
                await delay(500);
            }
        }
    }
}
