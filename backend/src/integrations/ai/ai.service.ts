import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export interface ChatMessageHistory {
  fromMe: boolean;
  text: string;
}

export interface ConsultantContext {
  storeName: string;
  agentName?: string;
  userMessage: string;
  leadName?: string;
  contextProperties?: any[];
  history?: ChatMessageHistory[];
  customInstructions?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private geminiModel: any = null;

  constructor(private configService: ConfigService) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(geminiKey);
        this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.logger.log('Gemini AI Provider initialized.');
      } catch (e) {
        this.logger.warn('Failed to init Gemini AI provider', e);
      }
    }
  }

  /**
   * Unified text generation with multi-provider fallback:
   * 1. Groq (Llama 3.3 70B - Free & Ultra Fast)
   * 2. OpenRouter (Free models: meta-llama/llama-3.3-70b-instruct:free)
   * 3. Google Gemini Flash (Free tier)
   */
  async generateCompletion(
    systemPrompt: string,
    userMessage: string,
    history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [],
  ): Promise<string> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    const openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY');

    // 1. Try Groq (Llama 3.3 70B Versatile - Free & Super Fast)
    if (groqKey) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage },
        ];
        const res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 600,
          },
          {
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );
        const content = res.data?.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } catch (err: any) {
        this.logger.warn(`Groq request failed: ${err?.message || err}. Falling back...`);
      }
    }

    // 2. Try OpenRouter (Free Model)
    if (openRouterKey) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage },
        ];
        const res = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages,
            temperature: 0.7,
            max_tokens: 600,
          },
          {
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://zapilar.online',
              'X-Title': 'Zapilar Real Estate AI',
            },
            timeout: 12000,
          },
        );
        const content = res.data?.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } catch (err: any) {
        this.logger.warn(`OpenRouter request failed: ${err?.message || err}. Falling back...`);
      }
    }

    // 3. Try Gemini Flash
    if (this.geminiModel) {
      try {
        const fullPrompt = `SYSTEM INSTRUCTION: ${systemPrompt}\n\n` +
          history.map((h) => `${h.role.toUpperCase()}: ${h.content}`).join('\n') +
          `\nUSER: ${userMessage}\nASSISTANT:`;
        const result = await this.geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.7,
          },
        });
        const text = result?.response?.text();
        if (text) return text.trim();
      } catch (err: any) {
        this.logger.warn(`Gemini request failed: ${err?.message || err}.`);
      }
    }

    return '';
  }

  /**
   * Atendimento Consultivo Especialista no Mercado Imobiliário de Goiás
   */
  async chatRealEstateConsultant(context: ConsultantContext): Promise<string> {
    const agentName = context.agentName || 'Sofia';
    const storeName = context.storeName || 'nossa Imobiliária';
    const leadName = context.leadName ? `, ${context.leadName}` : '';

    const propsSummary = (context.contextProperties || [])
      .slice(0, 4)
      .map(
        (p) =>
          `* ${p.title} (${p.type}) | ${p.neighborhood || p.location || p.city} | R$ ${Number(p.price || 0).toLocaleString('pt-BR')} | ${p.bedrooms || 0} qts | ${p.area} ${p.areaUnit || 'm²'} ${p.acceptsTrade ? '[Aceita Permuta]' : ''}`,
      )
      .join('\n');

    const systemPrompt = `
Você é ${agentName}, consultora imobiliária de elite e especialista da imobiliária "${storeName}" em Goiás.
Seu objetivo é encantar o cliente, tirar dúvidas com alta cordialidade, apresentar opções e conduzir sutilmente para um AGENDAMENTO DE VISITA ou contato com corretor.

CONHECIMENTO REGIONAL OBRIGATÓRIO (GOIÁS):
- Goiânia: Setor Bueno, Setor Marista, Jardim Goiás, Setor Oeste, Nova Suíça, Setor Sul, Parque Amazônia, Jardim América, Alto da Glória.
- Condomínios Fechados: Jardins (Verona, Valência, Munique, Paris, Parma), Alphaville Flamboyant, Aldeia do Vale, Portal do Sol.
- Cidades da Região Metropolitana: Aparecida de Goiânia, Senador Canedo, Trindade, Anápolis, Hidrolândia, Bela Vista de Goiás.
- Chácaras e Fazendas: Meça em "Alqueire Goiano" (1 alqueire = 4,84 ha = 48.400 m²). Conheça termos como Dupla Aptidão, terra de cultura, represa e nascente.
- Negociação: Em Goiás é muito comum PERMUTA (veículos como Hilux/SW4, gado, ou imóveis menores). Seja super receptiva a permutas!

REGRAS CRÍTICAS DE CONVERSA:
1. NUNCA responda como um robô de menu ("Digite 1 para... Digite 2 para..."). Converse de forma humana, acolhedora e natural no WhatsApp!
2. Use formatação limpa de WhatsApp: use negrito (*palavra*), emojis com elegância e parágrafos curtos.
3. Se o cliente procura imóvel, seja prestativa, pergunte se tem preferência de setor/bairro e se deseja avaliar permuta.
4. Finalize SEMPRE com uma pergunta aberta convidativa ou convite para visita/café com nosso corretor especialista.
5. Seja concisa (máximo 2 a 3 parágrafos curtos).

${context.customInstructions ? `INSTRUÇÕES EXTRAS DA IMOBILIÁRIA:\n${context.customInstructions}` : ''}

${propsSummary ? `IMÓVEIS DISPONÍVEIS NO NOSSO ESTOQUE RELEVANTES PARA ESSA BUSCA:\n${propsSummary}\n(Mencione esses imóveis com entusiasmo de forma natural, sem repetir links).` : ''}
`;

    const chatHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = (
      context.history || []
    ).map((h) => ({
      role: h.fromMe ? 'assistant' : 'user',
      content: h.text,
    }));

    const response = await this.generateCompletion(
      systemPrompt,
      context.userMessage,
      chatHistory,
    );

    if (response) return response;

    // Resposta padrão caso as IAs estejam sem chave
    return `Olá${leadName}! Seja muito bem-vindo(a) à *${storeName}*! Me chamo ${agentName}, sou consultor(a) imobiliário(a) aqui da equipe.\n\nComo posso te ajudar hoje? Está em busca de casa em condomínio, apartamento nos melhores setores de Goiânia, lote ou chácara? Me conta o que você tem em mente! 🏡✨`;
  }

  /**
   * Extração de intenção e entidades (Setores de Goiânia, Tipo, Permuta, Preço)
   */
  async analyzeIntent(
    message: string,
  ): Promise<{
    intent: 'SEARCH' | 'FAQ' | 'TALK' | 'SCHEDULE' | 'UNKNOWN';
    entities: {
      city?: string;
      neighborhood?: string;
      type?: string;
      rooms?: number;
      max_price?: number;
      acceptsTrade?: boolean;
      isGatedCommunity?: boolean;
      areaUnit?: 'm2' | 'alqueire';
    };
  }> {
    const systemPrompt = `
Você é um extrator de intenções para o mercado imobiliário brasileiro (especialmente Goiás).
Analise a mensagem do cliente e retorne APENAS um JSON válido no seguinte formato:
{
  "intent": "SEARCH" (procurando imóvel) | "FAQ" (dúvidas) | "TALK" (quer falar com corretor/humano) | "SCHEDULE" (quer visitar/agendar) | "UNKNOWN",
  "entities": {
    "city": "string ou null",
    "neighborhood": "Setor ou Bairro identificado (ex: Setor Bueno, Marista, Jardins, etc.) ou null",
    "type": "Casa, Apartamento, Lote, Terreno, Chácara, Fazenda ou null",
    "rooms": number ou null,
    "max_price": number (apenas valor numérico em reais) ou null,
    "acceptsTrade": true (se mencionou permuta, troca, carro, Hilux, lote) ou false,
    "isGatedCommunity": true (se mencionou condomínio fechado, Jardins, Alphaville, Aldeia do Vale) ou false,
    "areaUnit": "alqueire" (se mencionou alqueire) ou "m2"
  }
}
Retorne ESTRITAMENTE o JSON, sem markdown ou explicações.
`;

    try {
      const result = await this.generateCompletion(systemPrompt, message);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      this.logger.error('Error parsing intent JSON:', e);
    }

    // Heurística local de contingência
    const lower = message.toLowerCase();
    const isTalk = ['corretor', 'humano', 'pessoa', 'atendente', 'falar com'].some((k) =>
      lower.includes(k),
    );
    const isSchedule = ['agendar', 'visitar', 'conhecer', 'sábado', 'visita'].some((k) =>
      lower.includes(k),
    );
    const isSearch = [
      'procuro',
      'quero',
      'busco',
      'tem',
      'casa',
      'apartamento',
      'apê',
      'lote',
      'chácara',
      'fazenda',
      'bueno',
      'marista',
      'jardins',
      'preço',
      'valor',
    ].some((k) => lower.includes(k));

    return {
      intent: isTalk ? 'TALK' : isSchedule ? 'SCHEDULE' : isSearch ? 'SEARCH' : 'UNKNOWN',
      entities: {
        acceptsTrade: lower.includes('troca') || lower.includes('permuta') || lower.includes('carro'),
        isGatedCommunity: lower.includes('condomínio') || lower.includes('jardins') || lower.includes('alphaville'),
        areaUnit: lower.includes('alqueire') ? 'alqueire' : 'm2',
      },
    };
  }

  /**
   * Qualificação Avançada de Lead & Detector de "Lead Quente"
   */
  async extractQualification(message: string): Promise<{
    budget?: string;
    financing?: string;
    motivation?: string;
    urgency?: string;
    tradeOffer?: string;
    isHotLead: boolean;
    summary?: string;
  }> {
    const systemPrompt = `
Analise a mensagem do cliente imobiliário e avalie a qualificação e o nível de compra.
Retorne APENAS um JSON no formato:
{
  "budget": "ex: 800 mil, 1.5M ou null",
  "financing": "Sim, Não ou Em Análise",
  "motivation": "Moradia, Investimento ou Lazer",
  "urgency": "Alta, Média ou Baixa",
  "tradeOffer": "Descrição do que quer dar em permuta (ex: Hilux 2023, Lote no Jardins) ou null",
  "isHotLead": boolean (true se o cliente tem orçamento alto, urgência imediata, quer visitar logo ou propõe negociação clara),
  "summary": "Resumo em 1 frase curta do perfil do comprador"
}
Retorne ESTRITAMENTE o JSON.
`;

    try {
      const result = await this.generateCompletion(systemPrompt, message);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      this.logger.error('Error in qualification extraction:', e);
    }

    const lower = message.toLowerCase();
    const isHot = [
      'visita',
      'agendar',
      'fechar',
      'proposta',
      'comprar agora',
      'dinheiro na mão',
      'aprovado',
      'entrada',
    ].some((k) => lower.includes(k));

    return {
      urgency: isHot ? 'Alta' : 'Média',
      isHotLead: isHot,
      summary: 'Interesse manifestado via WhatsApp',
    };
  }

  async generateSearchSummary(
    userName: string,
    query: string,
    properties: any[],
  ): Promise<string> {
    if (properties.length === 0) return '';

    const propsContext = properties
      .slice(0, 3)
      .map(
        (p) =>
          `- ${p.type} em ${p.neighborhood || p.city}, ${p.bedrooms || 0} quartos, R$ ${Number(p.price || 0).toLocaleString('pt-BR')} ${p.acceptsTrade ? '(Aceita Permuta)' : ''}`,
      )
      .join('\n');

    const prompt = `
Aja como corretor(a) imobiliário(a) especialista em Goiás.
O cliente "${userName || 'Amigo'}" buscou por: "${query}".
Encontramos estes imóveis no estoque:
${propsContext}

Escreva uma mensagem CURTÍSSIMA (1 a 2 linhas), entusiasmada e elegante, apresentando essas opções no WhatsApp.
`;

    const res = await this.generateCompletion(prompt, query);
    return (
      res ||
      `Encontrei excelentes opções selecionadas que combinam muito com o que você procura! Confira os detalhes abaixo:`
    );
  }
}
