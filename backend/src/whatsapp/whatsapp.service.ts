
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

    constructor(
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService,
        private chatGateway: ChatGateway
    ) { }

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

    private async handleMessage(message: Message, userId: string) {
        // 0. Emit Incoming Message to Live Chat
        try {
            const contact = await message.getContact();
            const contactName = contact.pushname || contact.name || message.from;

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
        const allVehicles = await this.vehiclesService.findAll(userId);
        let contextVehicles: any[] = [];

        const ignoreTerms = ['bom', 'boa', 'tarde', 'noite', 'dia', 'ola', 'olá', 'tudo', 'bem', 'sim', 'não', 'quero'];
        const isGeneric = ignoreTerms.includes(msg) || msg.length <= 3;

        if (!isGeneric) {
            contextVehicles = allVehicles.filter(v => {
                const searchTerms = [v.name, v.brand, v.model].map(t => t?.toLowerCase() || '');
                return searchTerms.some(term => term && msg.includes(term));
            }).slice(0, 5);
        }

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
                Você é um vendedor experiente e simpático da loja "${storeName}".
                Mensagem do Cliente: "${message.body}"
                Veículos em estoque que correspondem à mensagem (pode estar vazio):
                ${params}
                Seu objetivo é:
                1. Analisar a intenção do cliente.
                2. Responder de forma natural e engajadora.
                Regras de Resposta:
                - Se o cliente apenas cumprimentou (Oi, Olá), responda cordialmente e pergunte o que ele busca. NÃO invente ofertas.
                - Se o cliente pediu um carro e ele ESTÁ na lista acima, diga que temos e que vai mostrar os detalhes.
                - Se o cliente pediu um carro e ele NÃO está na lista, diga que infelizmente não tem esse modelo exato no momento, mas pergunte se ele aceita ver outras opções.
                - Se o cliente perguntou endereço/telefone, responda se souber (ou diga pra consultar a bio).
                CONTROLE DE FLUXO (Crucial):
                No FINAL da sua resposta, adicione uma destas flags (invisíveis para o usuário final, eu vou remover depois):
                [SHOW_CARS] -> Use APENAS se você confirmou que temos o carro que o cliente pediu e vai mostrá-lo, ou se o cliente pediu para ver o estoque.
                [NO_CARS] -> Use em todos os outros casos (saudações, perguntas gerais, carro indisponível).
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
                const specs = `🔹 *${car.brand} ${car.name}* ${car.model || ''}
📅 Ano: ${car.year} | 🚦 Km: ${car.km || 'N/A'}
⛽ Combustível: ${car.fuel} | ⚙️ Câmbio: ${car.transmission}
🎨 Cor: ${car.color}
💰 *R$ ${Number(car.price).toLocaleString('pt-BR')}*

_Gostou deste? Digite_ *"Quero o ${car.name} ${car.year}"*`;

                await client.sendMessage(message.from, specs);

                // Emit Car Specs to Chat
                this.chatGateway.emitMessageToRoom(userId, {
                    id: 'bot-car-' + car.id,
                    from: 'bot',
                    body: specs,
                    timestamp: Date.now() / 1000,
                    senderName: storeName + ' (Bot)',
                    isBot: true
                });

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
