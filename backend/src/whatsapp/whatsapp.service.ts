
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { VehiclesService } from '../vehicles/vehicles.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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

import { ChatMessage } from './entities/chat-message.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ... other imports

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

onModuleInit() {
    this.initializeAI();
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

    // 2. Prepare Context (Smarter Search)
    // 2. Prepare Context (Smarter Strategy)
    const allVehicles = await this.vehiclesService.findAll(userId);
    let contextVehicles = allVehicles;

    // Optimization: If inventory is huge, we might overwhelm the AI prompt.
    // But for < 50 cars, sending all is better for intelligence (typo correction).
    // If > 50, we implement a lightweight fuzzy filter or just slice.
    if (allVehicles.length > 50) {
        // Fallback to keyword matching only if list is massive
        contextVehicles = allVehicles.filter(v => {
            const searchTerms = [v.name, v.brand, v.model].map(t => t?.toLowerCase() || '');
            // Simple inclusion check
            return searchTerms.some(term => term && msg.includes(term));
        });
        // If strict filter fails, fallback to recent cars to give AI some context
        if (contextVehicles.length === 0) {
            contextVehicles = allVehicles.slice(0, 20);
        }
    }

    const ignoreTerms = ['bom', 'boa', 'tarde', 'noite', 'dia', 'ola', 'olá', 'tudo', 'bem', 'sim', 'não', 'quero'];
    const isGeneric = ignoreTerms.includes(msg) || msg.length <= 3;


    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let shouldShowCars = false;
    let responseText = '';

    // 3. Fallback Logic Helper
    const fallbackResponse = async (): Promise<string> => {
        const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];

        if (greetings.some(g => msg.includes(g)) && contextVehicles.length === 0) {
            shouldShowCars = false;
            return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver nossas novidades!`;
        }

        if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
            shouldShowCars = false;
            return `📍 Estamos localizados em: [Endereço da Loja].\nVenha nos visitar!`;
        }

        if (contextVehicles.length > 0) {
            shouldShowCars = true;
            return `Encontrei ${contextVehicles.length} opção(ões) que podem te interessar! 🚘\n\nVou te mandar as fotos e detalhes agora:`;
        }

        if (msg.includes('estoque') || msg.includes('catalogo') || msg.includes('catálogo')) {
            contextVehicles = allVehicles.slice(0, 5);
            shouldShowCars = true;
            return `Claro! Aqui estão alguns destaques do nosso estoque atual:`;
        }

        shouldShowCars = false;
        return `Desculpe, não entendi bem. 😕\n\nPor favor, diga o **nome do carro** que procura (ex: *Gol*, *Corolla*) ou digite *Estoque* para ver tudo.`;
    };

    // 4. Try FAQ Match First
    const faqMatch = await this.faqService.findMatch(userId, msg);

    if (faqMatch) {
        responseText = faqMatch;
        shouldShowCars = false;
    } else if (this.model) {
        try {
            const params = contextVehicles.map(v =>
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
                   - SAUDAÇÃO (Oi, Olá, Tudo bem?): Responda cordialmente e pergunte como pode ajudar.
                   - BUSCA ESPECÍFICA: Se o cliente pediu um carro (ex: "tem hilux?", "busco civic"), procure na lista acima.
                     - DEU MATCH: Responda "Tenho sim! Tenho estas opções de [Nome do Carro]:".
                     - NÃO DEU MATCH: Responda "Poxa, esse modelo exato eu não tenho agora. 😕 Mas tenho outras opções incríveis! Que tal dar uma olhada no nosso estoque?".
                   - DÚVIDA GERAL (Endereço, Financiamento): Responda sucintamente.
                   - ESTOQUE GERAL ("quero ver carros", "catalogo"): Diga que vai mostrar os destaques.

                ** FLAGS DE CONTROLE (Obrigatório no final da mensagem) **
                - Adicione [SHOW_CARS] se encontrou o carro pedido OU se o cliente pediu para ver o estoque/catálogo.
                - Adicione [NO_CARS] caso contrário.
                
                ** IMPORTANTE **
                Não invente carros. Só ofereça o que está na lista acima.
                `;

            const result = await this.model.generateContent(prompt);
            const aiResponse = result.response.text();

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
