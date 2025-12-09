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

        // 1. Fetch available vehicles FOR THIS STORE ONLY
        const allVehicles = await this.vehiclesService.findAll(userId);

        // 2. Simple keyword filter
        const contextVehicles = allVehicles.filter(v =>
            msg.includes(v.name.toLowerCase()) ||
            msg.includes(v.brand.toLowerCase()) ||
            msg.includes(v.model.toLowerCase()) ||
            msg.includes('ver') ||
            msg.includes('tem') ||
            msg.includes('lista') ||
            msg.includes('estoque')
        ).slice(0, 5);

        // 3. Generate AI Response
        let responseText = '';

        if (this.model) {
            try {
                const user = await this.usersService.findById(userId);
                const phoneLink = user?.phone ? `https://wa.me/55${user.phone.replace(/\D/g, '')}` : 'https://wa.me/5511999999999';
                const storeName = user?.storeName || "Zapicar";

                const prompt = `
                Atue como o assistente virtual oficial da "${storeName}". Sua missão é qualificar o lead e levar ao agendamento.
                
                O cliente disse: "${message.body}"
                
                ESTOQUE DISPONÍVEL PARA ESTA CONSULTA:
                ${JSON.stringify(contextVehicles.map(v => `${v.brand} ${v.name} ${v.model} (${v.year}) - R$ ${v.price}`))}
                
                DIRETRIZES ESTRATÉGICAS:
                1. **ABERTURA (Se o cliente disser apenas "Oi", "Olá", "Tudo bem")**:
                   NÃO diga "não entendi". Diga exatamente:
                   "Olá! 🚗 Sou o assistente virtual da ${storeName}.
                   Posso te ajudar a encontrar seu próximo carro. Você procura por SUVs, Sedans ou Hatchs?"
                
                2. **CONSULTA DE VEÍCULO**:
                   Se o estoque acima tiver carros que combinam com o pedido:
                   - Apresente as opções resumidamente.
                   - Destaque o melhor custo-benefício.
                   - **OBRIGATÓRIO:** Termine a mensagem perguntando: "Gostou de alguma opção? Quer ver mais fotos ou agendar um Test-Drive? 🗓️"

                3. **AGENDAMENTO / HUMANO**:
                   - Se o cliente quiser "Test-Drive" ou "Ver o carro": Pergunte "Ótimo! Qual o melhor dia e horário para você?"
                   - Se o cliente parecer confuso ou pedir "Humano": Envie: "Vou chamar um consultor para te ajudar! Clique aqui: ${phoneLink}"

                4. **PERSONALIDADE**:
                   - Use Português do Brasil natural.
                   - Use emojis para quebrar o gelo.
                   - Seja proativo. Não deixe a conversa morrer.
            `;

                const result = await this.model.generateContent(prompt);
                const response = await result.response;
                responseText = response.text();
            } catch (error) {
                console.error('AI Generation Error:', error);
                // Fallback to keyword search if AI fails
                responseText = contextVehicles.length > 0
                    ? `Encontrei estes veículos para você:\n${contextVehicles.map(v => `🚗 ${v.name} - R$ ${v.price}`).join('\n')}`
                    : 'Olá! Não entendi bem ou não encontrei esse modelo. Tente buscar por marca ou modelo (ex: Hilux).';
            }
        } else {
            responseText = contextVehicles.length > 0
                ? `Encontrei estes veículos para você:\n${contextVehicles.map(v => `🚗 ${v.name} - R$ ${v.price}`).join('\n')}`
                : 'Olá! Não entendi bem ou não encontrei esse modelo. Tente buscar por marca ou modelo (ex: Hilux).';
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
