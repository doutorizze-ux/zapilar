import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { VehiclesService } from '../vehicles/vehicles.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { UsersService } from '../users/users.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
    // Map<userId, Client>
    private clients: Map<string, Client> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService
    ) { }

    onModuleInit() {
        this.initializeAI();
        // We do NOT initialize a single client anymore. 
        // Clients are initialized on demand (when user visits the dashboard).
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
            // Pass the userId so we know WHICH store's vehicles to search
            await this.handleMessage(message, userId);
        });

        try {
            await client.initialize();
        } catch (e) {
            console.error(`Failed to initialize client for ${userId}`, e);
        }
    }

    private async handleMessage(message: Message, userId: string) {
        const msg = message.body.toLowerCase();

        // 1. Get User Context
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";

        // 2. Fallback Logic Helper
        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];
            if (greetings.some(g => msg.includes(g) && msg.length < 15)) {
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver nossas novidades!`;
            }

            if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
                return `📍 Estamos localizados em: [Seu Endereço Aqui - Configure no Painel].\nVenha nos visitar!`;
            }

            // aggressive keyword search if AI fails
            const allVehicles = await this.vehiclesService.findAll(userId);
            const matches = allVehicles.filter(v =>
                msg.includes(v.name.toLowerCase()) ||
                msg.includes(v.brand.toLowerCase()) ||
                msg.includes(v.model.toLowerCase()) ||
                (v.name + v.brand + v.model).toLowerCase().includes(msg)
            ).slice(0, 5);

            if (matches.length > 0) {
                return `Encontrei essas opções para você 🚘:\n\n${matches.map(v => `🔹 *${v.brand} ${v.name}* ${v.model}\n   📅 ${v.year} | 💰 R$ ${v.price.toLocaleString('pt-BR')}`).join('\n\n')}\n\nGostou de algum? Digite *Tenho interesse*!`;
            } else {
                // Show 3 random featured cars
                const featured = allVehicles.slice(0, 3);
                if (featured.length > 0) {
                    return `Poxa, não encontrei exatamente o que você pediu. 😕\n\nMas olha só o que acabou de chegar:\n\n${featured.map(v => `🔥 *${v.brand} ${v.name}*\n   � R$ ${v.price.toLocaleString('pt-BR')}`).join('\n\n')}\n\nDigite o nome de um desses para ver mais fotos!`;
                }
                return `Olá! Não encontrei esse modelo no momento. 😕\n\nTente buscar por marca (ex: *Fiat*, *Toyota*) ou digite *Estoque* para ver tudo.`;
            }
        };

        // 3. Try AI Generation
        let responseText = '';
        if (this.model) {
            try {
                // Fetch relevant vehicles first for AI context
                // ... (Use same aggressive filtering as fallback to give AI good context)
                const allVehicles = await this.vehiclesService.findAll(userId);
                const contextVehicles = allVehicles.filter(v =>
                    msg.includes(v.name.toLowerCase()) ||
                    msg.includes(v.brand.toLowerCase()) ||
                    msg.includes(v.model.toLowerCase())
                ).slice(0, 5);

                const prompt = `
                Atue como vendedor sênior da loja "${storeName}". 
                Cliente disse: "${message.body}"
                
                Carros Disponíveis (Filtro): ${JSON.stringify(contextVehicles.map(v => `${v.brand} ${v.name} (${v.year}) - R$ ${v.price}`))}.
                
                Se não houver carros na lista acima, diga que não encontrou exato mas convide para visitar a loja.
                Se houver, apresente-os com entusiasmo.
                Se for apenas "Oi", seja curto e simpático: "Olá! Bem vindo à ${storeName}. O que procura hoje?"
                `;

                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                responseText = response.text();
            } catch (error) {
                console.error('AI Failed, using fallback strategy', error);
                responseText = await fallbackResponse();
            }
        } else {
            responseText = await fallbackResponse();
        }
        // 4. Reply
        await message.reply(responseText);

        // 5. Send Images
        if (contextVehicles.length > 0) {
            const client = this.clients.get(userId);
            if (!client) return;

            for (const car of contextVehicles) {
                if (car.images && car.images.length > 0) {
                    try {
                        const imageUrl = car.images[0];
                        if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
                            const media = await MessageMedia.fromUrl(imageUrl);
                            await client.sendMessage(message.from, media, { caption: `📸 ${car.brand} ${car.name}` });
                        }
                    } catch (e) {
                        console.error(`Failed to send image for ${car.name}:`, e);
                    }
                }
            }
        }
    }
}
