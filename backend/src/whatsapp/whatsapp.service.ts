import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { VehiclesService } from '../vehicles/vehicles.service';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';

import { LeadsService } from '../leads/leads.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
    // ...
    // Map<userId, Client>
    private clients: Map<string, Client> = new Map();
    private qrCodes: Map<string, string> = new Map();
    private statuses: Map<string, 'DISCONNECTED' | 'CONNECTED' | 'QR_READY'> = new Map();
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(
        private vehiclesService: VehiclesService,
        private configService: ConfigService,
        private usersService: UsersService,
        private faqService: FaqService,
        private leadsService: LeadsService
    ) { }

    // ...

    private async handleMessage(message: Message, userId: string) {
        const msg = message.body.toLowerCase();

        try {
            const contact = await message.getContact();
            await this.leadsService.upsert(userId, message.from, message.body, contact.pushname || contact.name);
        } catch (e) {
            console.error('Error tracking lead', e);
        }

        // 1. Get User Context
        const user = await this.usersService.findById(userId);
        const storeName = user?.storeName || "ZapCar";

        // 2. Prepare Context (Aggressive Search) - Moved to top for scope availability
        const allVehicles = await this.vehiclesService.findAll(userId);
        const contextVehicles = allVehicles.filter(v =>
            msg.includes(v.name.toLowerCase()) ||
            msg.includes(v.brand.toLowerCase()) ||
            msg.includes(v.model.toLowerCase()) ||
            (v.name + v.brand + v.model).toLowerCase().includes(msg)
        ).slice(0, 5);

        // Helper to delay (prevent spam blocking)
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 3. Fallback Logic Helper
        const fallbackResponse = async (): Promise<string> => {
            const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'epa', 'opa'];
            if (greetings.some(g => msg.includes(g) && msg.length < 15)) {
                return `Olá! 👋 Bem-vindo à *${storeName}*.\n\nSou seu assistente virtual. Digite o nome do carro que procura (ex: *Hilux*, *Civic*) ou digite *Estoque* para ver nossas novidades!`;
            }

            if (msg.includes('endereço') || msg.includes('local') || msg.includes('onde fica')) {
                return `📍 Estamos localizados em: [Seu Endereço Aqui - Configure no Painel].\nVenha nos visitar!`;
            }

            // Handle general interest without specific car - Prompt for details
            if (msg.includes('interesse') || msg.includes('gostei') || msg.includes('quero') || msg.includes('comprar')) {
                return `Que ótimo! 😃 Fico feliz que tenha gostado.\n\nPara agilizar, me diga: *qual modelo* ou *ano* do carro chamou sua atenção? (Ex: "O Gol 2015" ou "O Civic")\n\nAssim consigo te ajudar melhor!`;
            }

            // aggressive keyword search
            if (contextVehicles.length > 0) {
                return `Encontrei ${contextVehicles.length} opção(ões) para você! 🚘\n\nVeja os detalhes abaixo:`;
            } else {
                // Show 3 random featured cars
                const featured = allVehicles.slice(0, 3);
                if (featured.length > 0) {
                    return `Poxa, não encontrei exatamente esse modelo. 😕\n\nMas olha só o que acabou de chegar no nosso estoque:`;
                }
                return `Olá! Não encontrei esse modelo no momento. 😕\n\nTente buscar por marca (ex: *Fiat*, *Toyota*) ou digite *Estoque* para ver tudo.`;
            }
        };

        // 4. Try FAQ Match First
        const faqMatch = await this.faqService.findMatch(userId, msg);
        let responseText = '';

        if (faqMatch) {
            responseText = faqMatch;
        } else if (this.model) {
            try {
                // Enrich context for AI
                const params = contextVehicles.map(v =>
                    `${v.brand} ${v.name} ${v.model} (${v.year})`
                ).join('\n');

                const prompt = `
                Atue como vendedor sênior da loja "${storeName}". 
                Cliente disse: "${message.body}"
                
                Eu tenho esses carros em estoque que correspondem à busca (resumo):
                ${params}
                
                Se houver veículos listados acima:
                - Responda ao cliente criando expectativa e convidando para ver as fotos abaixo.
                - NÃO dite os preços ou fichas técnicas na mensagem de texto, pois o sistema enviará fichas individuais logo em seguida.
                - Se o cliente fez uma pergunta específica (ex: "tem teto solar?"), você pode responder se souber, mas foque em apresentar os carros.
                
                Se a lista estiver vazia:
                - Diga que não encontrou o exato, mas mostre os destaques (se houver, o sistema enviará).
                - Seja simpático e use emojis.
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

        // 5. Reply with Intro
        await message.reply(responseText);

        // 6. Send Cars (Card + Images) Sequentially
        const client = this.clients.get(userId);
        if (!client) return;

        // Determine which vehicles to show
        let vehiclesToShow = contextVehicles;
        // If no match but we have featured (fallback logic for empty search)
        if (vehiclesToShow.length === 0 && !responseText.includes('Não encontrei') && responseText.includes('acabou de chegar')) {
            vehiclesToShow = allVehicles.slice(0, 3);
        }

        if (vehiclesToShow.length > 0) {
            for (const car of vehiclesToShow.slice(0, 5)) { // Limit to 5 cars
                // A. Send Specs Text
                const specs = `🔹 *${car.brand} ${car.name}* ${car.model || ''}
📅 Ano: ${car.year} | 🚦 Km: ${car.km || 'N/A'}
⛽ Combustível: ${car.fuel} | ⚙️ Câmbio: ${car.transmission}
🎨 Cor: ${car.color}
💰 *R$ ${Number(car.price).toLocaleString('pt-BR')}*

_Gostou deste? Digite_ *"Quero o ${car.name} ${car.year}"*`;

                await client.sendMessage(message.from, specs);
                await delay(800);

                // B. Send Images
                if (car.images && car.images.length > 0) {
                    const imagesToSend = car.images.slice(0, 4); // Max 4 images per car

                    for (const imageUrl of imagesToSend) {
                        try {
                            if (!imageUrl) continue;

                            let finalUrl = imageUrl;
                            // If relative path, prepend localhost (Docker container internal access)
                            if (imageUrl.startsWith('/')) {
                                const port = process.env.PORT || 3000;
                                finalUrl = `http://localhost:${port}${imageUrl}`;
                            }

                            if (finalUrl.startsWith('http')) {
                                console.log(`Sending image: ${finalUrl}`);
                                const media = await MessageMedia.fromUrl(finalUrl);
                                await client.sendMessage(message.from, media);
                                await delay(1000);
                            }
                        } catch (e) {
                            console.error(`Failed to send image for ${car.name}:`, e);
                        }
                    }
                }

                await delay(1500); // Delay between vehicles
                await client.sendMessage(message.from, '--------------------------------');
                await delay(500);
            }
        }
    }
}
