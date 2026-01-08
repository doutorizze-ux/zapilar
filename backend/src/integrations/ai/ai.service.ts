
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        } else {
            this.logger.warn('GEMINI_API_KEY not found. AI features will be disabled.');
        }
    }

    async generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
        if (!this.model) return '';

        try {
            const result = await this.model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: `SYSTEM: ${systemPrompt}\n\nUSER: ${userMessage}` }] }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

            return result.response.text();
        } catch (error) {
            this.logger.error('Error generating AI response:', error);
            return '';
        }
    }

    async analyzeIntent(message: string): Promise<{ intent: 'SEARCH' | 'FAQ' | 'TALK' | 'UNKNOWN', entities: any }> {
        if (!this.model) return { intent: 'UNKNOWN', entities: {} };

        const prompt = `
            Analyze the following message from a real estate customer and return a JSON object with:
            - intent: "SEARCH" (if looking for property), "FAQ" (if asking questions about rules/info), "TALK" (if wanting to speak to human), "UNKNOWN".
            - entities: { city, neighborhood, type, rooms, max_price } (extract if available).
            
            Message: "${message}"
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            // A simple attempt to extract JSON
            const jsonStr = text.match(/\{.*\}/s)?.[0];
            if (jsonStr) {
                return JSON.parse(jsonStr);
            }
        } catch (e) {
            this.logger.error('Error analyzing intent with AI:', e);
        }

        return { intent: 'UNKNOWN', entities: {} };
    }

    async extractQualification(message: string): Promise<any> {
        if (!this.model) return null;

        const prompt = `
            Extract lead qualification data from the following message.
            The user might answer briefly (e.g., just "morar", "investir", "200 mil").
            Infer context if possible.
            
            Identify: 
            - budget (e.g. "500k", "2000", "unknown")
            - financing (Yes/No/Unsure)
            - motivation (Living/Investment) - map "morar", "casa", "familia" to Living. Map "renda", "aluguel", "investir" to Investment.
            - urgency (Immediate/Soon/Researching)
            - notes (brief summary in Portuguese)

            If a field is missing, set it to null.
            Respond ONLY with a valid JSON object.
            
            Message: "${message}"
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.match(/\{.*\}/s)?.[0];
            if (jsonStr) {
                return JSON.parse(jsonStr);
            }
        } catch (e) {
            this.logger.error('Error extracting qualification with AI:', e);
        }
        return null;
    }
}
