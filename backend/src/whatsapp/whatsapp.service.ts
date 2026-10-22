import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
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
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';

import { ChatMessage } from './entities/chat-message.entity';
import { PropertiesService } from '../properties/properties.service';
import { UsersService } from '../users/users.service';
import { FaqService } from '../faq/faq.service';
import { LeadsService } from '../leads/leads.service';
import { AiService } from '../integrations/ai/ai.service';
import { AgendaService } from '../agenda/agenda.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private sessions: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private connectionStatuses: Map<
    string,
    'CONNECTED' | 'DISCONNECTED' | 'QR_READY' | 'CONNECTING'
  > = new Map();

  // State Machine for Chat
  private userStates: Map<
    string,
    {
      mode:
        | 'CONVERSATIONAL'
        | 'MENU'
        | 'WAITING_PROPERTY_NAME'
        | 'WAITING_FAQ'
        | 'HANDOVER'
        | 'WAITING_CITY'
        | 'WAITING_TYPE'
        | 'WAITING_NEIGHBORHOOD'
        | 'WAITING_SEARCH'
        | 'SEARCH_FINISHED'
        | 'WAITING_QUALIFICATION'
        | 'WAITING_SCHEDULE_DATE'
        | 'WAITING_SCHEDULE_TIME';
      tempCity?: string;
      tempType?: string;
      tempPropertyId?: string;
      tempDate?: string;
      slots?: any[];
      lastIntent?: string;
    }
  > = new Map();

  // Pause List
  private pausedUsers: Set<string> = new Set();

  private readonly SESSIONS_DIR = path.join(process.cwd(), 'whatsapp_sessions');
  private sessionStartTimes: Map<string, number> = new Map();

  constructor(
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,
    private propertiesService: PropertiesService,
    private configService: ConfigService,
    private usersService: UsersService,
    private faqService: FaqService,
    private leadsService: LeadsService,
    private aiService: AiService,
    private agendaService: AgendaService,
  ) {
    if (!fs.existsSync(this.SESSIONS_DIR)) {
      fs.mkdirSync(this.SESSIONS_DIR, { recursive: true });
    }
  }

  async onModuleInit() {
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

  // --- Session Management ---

  private async restoreSessions() {
    try {
      const files = fs.readdirSync(this.SESSIONS_DIR);
      const userDirs = files.filter(
        (f) =>
          fs.statSync(path.join(this.SESSIONS_DIR, f)).isDirectory() &&
          f.startsWith('user_'),
      );

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

  async getSessionStatus(userId: string) {
    let status = this.connectionStatuses.get(userId) || 'DISCONNECTED';
    let qr = this.qrCodes.get(userId) || null;

    if (status === 'DISCONNECTED' && !qr) {
      this.createSession(userId);
      status = 'CONNECTING';
    }

    return { status, qr };
  }

  async createSession(userId: string): Promise<WASocket> {
    if (this.sessions.has(userId)) {
      return this.sessions.get(userId)!;
    }

    this.connectionStatuses.set(userId, 'CONNECTING');
    this.sessionStartTimes.set(userId, Date.now());

    const sessionPath = path.join(this.SESSIONS_DIR, `user_${userId}`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }) as any,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: 'silent' }) as any,
        ),
      },
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
    });

    this.sessions.set(userId, sock);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.logger.log(`[Baileys] QR Code generated for user ${userId}`);
        this.qrCodes.set(userId, qr);
        this.connectionStatuses.set(userId, 'QR_READY');
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        this.logger.log(
          `[Baileys] Connection closed for user ${userId}. Reconnecting: ${shouldReconnect}`,
        );

        this.sessions.delete(userId);
        this.qrCodes.delete(userId);
        this.connectionStatuses.set(userId, 'DISCONNECTED');

        if (shouldReconnect) {
          setTimeout(() => this.createSession(userId), 3000);
        } else {
          this.logger.log(
            `[Baileys] User ${userId} logged out. Cleaning up session files.`,
          );
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          }
        }
      } else if (connection === 'open') {
        this.logger.log(`[Baileys] Connected successfully for user ${userId}!`);
        this.connectionStatuses.set(userId, 'CONNECTED');
        this.qrCodes.delete(userId);
        this.sessionStartTimes.delete(userId);
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

  private startInactivityCheck() {
    setInterval(() => {
      const now = Date.now();
      this.connectionStatuses.forEach((status, userId) => {
        const started = this.sessionStartTimes.get(userId) || 0;
        if (
          (status === 'QR_READY' || status === 'CONNECTING') &&
          now - started > 300000
        ) {
          this.logger.log(
            `Session for ${userId} timed out (Inactive). Destroying.`,
          );
          this.deleteInstance(userId);
        }
      });
    }, 60000);
  }

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

  private async processIncomingMessage(
    userId: string,
    msg: proto.IWebMessageInfo,
  ) {
    const jid = msg.key?.remoteJid;
    if (!jid) return;

    if (
      jid.includes('status@broadcast') ||
      jid.includes('@newsletter') ||
      jid.includes('@g.us')
    ) {
      return;
    }

    const name = msg.pushName || jid.split('@')[0];

    let text = '';
    const m = msg.message;
    if (!m) return;

    if (m.conversation) text = m.conversation;
    else if (m.extendedTextMessage?.text) text = m.extendedTextMessage.text;
    else if (m.imageMessage?.caption) text = m.imageMessage.caption;
    else if (m.buttonsResponseMessage?.selectedButtonId)
      text = m.buttonsResponseMessage.selectedButtonId;
    else if (m.listResponseMessage?.singleSelectReply?.selectedRowId)
      text = m.listResponseMessage.singleSelectReply.selectedRowId;
    else if (m.templateButtonReplyMessage?.selectedId)
      text = m.templateButtonReplyMessage.selectedId;
    else if (m.interactiveResponseMessage) {
      const native = m.interactiveResponseMessage.nativeFlowResponseMessage;
      if (native) {
        try {
          const params = JSON.parse(native.paramsJson || '{}');
          text = params.id || '';
        } catch (e) {}
      }
    }

    if (!text) return;

    const msgTime =
      (typeof msg.messageTimestamp === 'number'
        ? msg.messageTimestamp
        : (msg.messageTimestamp as any).low) * 1000;

    const now = Date.now();
    if (now - msgTime > 120000) {
      return;
    }

    this.logger.log(`[Baileys] Msg from ${name}: ${text}`);

    await this.logMessage(
      userId,
      jid,
      jid,
      text,
      name,
      false,
      msg.key?.id || undefined,
    );

    if (this.isBotPaused(userId)) return;

    await this.handleAutoReply(userId, jid, text, name);
  }

  /**
   * Atendimento Inteligente Humanizado de Elite (Sem menus robóticos URA)
   */
  private async handleAutoReply(
    userId: string,
    jid: string,
    text: string,
    name: string,
  ) {
    try {
      await this.leadsService.upsert(userId, jid, text, name);
    } catch (e) {
      // ignore
    }

    const msg = text.trim();
    const lowerMsg = msg.toLowerCase();
    const normalizedMsg = lowerMsg
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '');

    const user = await this.usersService.findById(userId);
    const storeName = user?.storeName || 'Imobiliária';
    const agentName = user?.aiAgentName || 'Sofia';

    const stateKey = `${userId}:${jid}`;
    const stateData = this.userStates.get(stateKey) || { mode: 'CONVERSATIONAL' };
    const currentState = stateData.mode;
    const isFirstMessage = !this.userStates.has(stateKey);

    // 1. Handover Humano (Corretor presencial)
    const humanKeywords = ['atendente', 'consultor', 'vendedor', 'humano', 'falar com pessoa', 'corretor', 'gerente'];
    if (humanKeywords.some((keyword) => lowerMsg.includes(keyword))) {
      this.logger.log(`Handover requested for ${jid}`);
      await this.handleConsultantHandover(userId, jid, name, msg);
      return;
    }

    // Se estiver em modo HANDOVER (atendimento humano ativo)
    if (currentState === 'HANDOVER') {
      if (['reiniciar', 'inicio', 'voltar', 'oi', 'ola'].includes(normalizedMsg)) {
        this.userStates.set(stateKey, { mode: 'CONVERSATIONAL' });
        await this.sendConversationalGreeting(userId, jid, storeName, agentName, name);
        return;
      }
      return; // Deixa o corretor humano conduzir a conversa
    }

    // 2. Fluxo de Agendamento de Visita
    if (currentState === 'WAITING_SCHEDULE_DATE') {
      await this.handleScheduleDateSelection(userId, jid, msg);
      return;
    }
    if (currentState === 'WAITING_SCHEDULE_TIME') {
      await this.handleScheduleTimeSelection(userId, jid, msg);
      return;
    }
    if (normalizedMsg.includes('agendar') || normalizedMsg.includes('visitar') || normalizedMsg.includes('marcar visita')) {
      await this.handleStartScheduling(userId, jid);
      return;
    }

    // 3. Primeira Mensagem / Saudação Inicial
    if (isFirstMessage || ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'opa', 'ola tudo bem'].includes(normalizedMsg)) {
      this.userStates.set(stateKey, { mode: 'CONVERSATIONAL' });
      await this.sendConversationalGreeting(userId, jid, storeName, agentName, name);
      return;
    }

    // 4. Análise de Intenção e Qualificação com IA
    const [intentAnalysis, qualification] = await Promise.all([
      this.aiService.analyzeIntent(msg),
      this.aiService.extractQualification(msg),
    ]);

    this.logger.log(`[AI-INTENT] ${JSON.stringify(intentAnalysis)}`);
    this.logger.log(`[AI-QUALIFY] ${JSON.stringify(qualification)}`);

    // Atualiza qualificação do lead no banco
    if (qualification) {
      await this.leadsService.updateQualification(userId, jid, {
        budget: qualification.budget || undefined,
        financing: qualification.financing || undefined,
        motivation: qualification.motivation || undefined,
        urgency: qualification.urgency || undefined,
        isHot: qualification.isHotLead,
      });

      // Se for LEAD QUENTE, dispara alerta no WhatsApp do Corretor / Dono
      if (qualification.isHotLead) {
        await this.sendHotLeadAlertToBroker(userId, jid, name, qualification, msg);
      }
    }

    // 5. Intenção: Falar com Humano
    if (intentAnalysis.intent === 'TALK') {
      await this.handleConsultantHandover(userId, jid, name, msg);
      return;
    }

    // 6. Intenção: Agendar Visita
    if (intentAnalysis.intent === 'SCHEDULE') {
      await this.handleStartScheduling(userId, jid);
      return;
    }

    // 7. Intenção: Busca de Imóveis ou Consulta de Estoque
    if (intentAnalysis.intent === 'SEARCH' || msg.length > 3) {
      const allProperties = await this.propertiesService.findAll(userId, true);
      const matchingProperties = this.filterAndScoreProperties(allProperties, intentAnalysis.entities, msg);

      if (matchingProperties.length > 0) {
        // Gera resposta natural de introdução via IA
        const summary = await this.aiService.generateSearchSummary(name, msg, matchingProperties);
        await this.sendMessage(userId, jid, summary);

        // Envia os cards dos melhores imóveis (até 3 imóveis)
        await this.sendPropertyCards(userId, jid, matchingProperties.slice(0, 3), user);

        // Pergunta aberta consultiva
        await new Promise((r) => setTimeout(r, 1200));
        await this.sendMessage(
          userId,
          jid,
          `Gostou de alguma dessas opções? Se quiser, posso *agendar uma visita presencial* com nosso corretor especialista para te acompanhar sem compromisso! Ou gostaria de ajustar valores/setor? ☕🏡`,
        );
        this.userStates.set(stateKey, { mode: 'SEARCH_FINISHED' });
        return;
      }
    }

    // 8. Conversa Geral / Dúvidas / FAQ com a Consultora IA
    const history = await this.getChatHistory(userId, jid);
    const formattedHistory = history.slice(-6).map((h) => ({
      fromMe: h.isBot || h.from === 'me',
      text: h.body,
    }));

    const aiConsultantReply = await this.aiService.chatRealEstateConsultant({
      storeName,
      agentName,
      userMessage: msg,
      leadName: name,
      history: formattedHistory,
      customInstructions: user?.aiCustomInstructions,
    });

    await this.sendMessage(userId, jid, aiConsultantReply);
  }

  private async sendConversationalGreeting(
    userId: string,
    jid: string,
    storeName: string,
    agentName: string,
    leadName?: string,
  ) {
    const nameStr = leadName && leadName !== jid.split('@')[0] ? ` *${leadName}*` : '';

    const greeting = `👋 Olá${nameStr}! Seja muito bem-vindo(a) à *${storeName}*!

Me chamo *${agentName}*, consultora imobiliária da equipe. 🤝

Estou aqui para te ajudar a encontrar o imóvel ideal em Goiás — seja um *apartamento nos melhores setores de Goiânia* (Bueno, Marista, Oeste, Jardim Goiás), uma *casa em condomínio fechado* (Jardins, Alphaville, Aldeia do Vale), um *lote* ou uma *chácara/fazenda*.

💡 *Me conta:* que tipo de imóvel você está buscando e em qual região você prefere? Se já tiver uma faixa de valor em mente, pode me dizer! ✨`;

    await this.sendMessage(userId, jid, greeting);
  }

  private filterAndScoreProperties(
    properties: any[],
    entities: any,
    rawQuery: string,
  ): any[] {
    const qLower = (rawQuery || '').toLowerCase();
    const tokens = qLower.split(/\s+/).filter((t) => t.length > 2);

    const scored = properties.map((p) => {
      let score = 0;
      const title = (p.title || '').toLowerCase();
      const type = (p.type || '').toLowerCase();
      const city = (p.city || '').toLowerCase();
      const neighborhood = (p.neighborhood || '').toLowerCase();
      const description = (p.description || '').toLowerCase();
      const condoName = (p.condoName || '').toLowerCase();

      // Entity Match (Goiás Specifics)
      if (entities) {
        if (entities.neighborhood && (neighborhood.includes(entities.neighborhood.toLowerCase()) || title.includes(entities.neighborhood.toLowerCase()))) {
          score += 60;
        }
        if (entities.city && city.includes(entities.city.toLowerCase())) {
          score += 40;
        }
        if (entities.type && type.includes(entities.type.toLowerCase())) {
          score += 40;
        }
        if (entities.rooms && p.bedrooms >= entities.rooms) {
          score += 25;
        }
        if (entities.max_price && p.price <= entities.max_price) {
          score += 30;
        }
        if (entities.acceptsTrade && p.acceptsTrade) {
          score += 35;
        }
        if (entities.isGatedCommunity && (p.isGatedCommunity || condoName.length > 0)) {
          score += 40;
        }
      }

      // Token Search
      const searchBlob = `${title} ${type} ${neighborhood} ${city} ${description} ${condoName} ${p.area} ${p.price}`;
      for (const t of tokens) {
        if (searchBlob.includes(t)) score += 5;
        if (neighborhood.includes(t)) score += 15;
        if (type.includes(t)) score += 10;
      }

      return { property: p, score };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.property);
  }

  private async sendPropertyCards(
    userId: string,
    jid: string,
    properties: any[],
    user: any,
  ) {
    const frontendUrl =
      this.configService.get('FRONTEND_URL') || 'https://zapilar.online';
    const slug = user?.slug || userId;

    for (const prop of properties) {
      if (prop.images && prop.images.length > 0) {
        const firstImage = this.resolveImageUrl(prop.images[0]);
        await this.sendImage(userId, jid, firstImage);
        await new Promise((r) => setTimeout(r, 600));
      }

      const priceStr = Number(prop.price || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      });

      const areaFormatted = prop.areaUnit === 'alqueire'
        ? `${prop.area} Alqueires Goianos (~${(prop.area * 4.84).toFixed(1)} ha)`
        : `${prop.area} m²`;

      const propertyLink = `${frontendUrl}/${slug}/imovel/${prop.id}`;

      let specs = `🏡 *${prop.title}*
📍 *Localização:* ${prop.neighborhood ? `${prop.neighborhood}, ` : ''}${prop.city || 'Goiás'}
📐 *Área:* ${areaFormatted}
🛏️ *Quartos:* ${prop.bedrooms || 0} | 🚿 *Banheiros:* ${prop.bathrooms || 0} | 🚗 *Vagas:* ${prop.parkingSpaces || 0}
💰 *Valor:* R$ ${priceStr}`;

      if (prop.acceptsTrade) {
        specs += `\n🔄 *Aceita Permuta:* Sim (avalia veículo/imóvel)`;
      }
      if (prop.isGatedCommunity) {
        specs += `\n🛡️ *Condomínio Fechado:* ${prop.condoName || 'Sim'}`;
      }
      if (prop.directFinancing) {
        specs += `\n📋 *Financiamento Direto c/ Balões*`;
      }

      specs += `\n\n🔗 *Fotos e Tour Completo:*\n${propertyLink}`;

      await this.sendMessage(userId, jid, specs);
      await new Promise((r) => setTimeout(r, 900));
    }
  }

  /**
   * Alerta Instantâneo de Lead Quente para o WhatsApp Pessoal do Corretor / Dono da Imobiliária
   */
  private async sendHotLeadAlertToBroker(
    userId: string,
    leadJid: string,
    leadName: string,
    qualification: any,
    lastMsg: string,
  ) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user || !user.phone || user.notifyHotLeads === false) return;

      const brokerPhone = user.phone.replace(/\D/g, '');
      if (brokerPhone.length < 10) return;

      const brokerJid = `${brokerPhone}@s.whatsapp.net`;
      const leadPhone = leadJid.replace(/\D/g, '');

      const alert = `🔥 *ALERTA ZAPILAR: LEAD QUENTE NO WHATSAPP!*
──────────────────────
👤 *Cliente:* ${leadName || 'Interessado'}
📱 *WhatsApp:* wa.me/${leadPhone}
💰 *Orçamento:* ${qualification.budget || 'A definir'}
🚗 *Permuta:* ${qualification.tradeOffer || (qualification.acceptsTrade ? 'Sim (avalia permuta)' : 'Não informado')}
🎯 *Objetivo:* ${qualification.motivation || 'Moradia / Investimento'}
⚡ *Urgência:* ${qualification.urgency || 'Alta'}
💬 *Última Mensagem:* "${lastMsg}"
──────────────────────
👉 _Assuma o atendimento ou entre em contato com o cliente agora mesmo!_`;

      await this.sendMessage(userId, brokerJid, alert);
      this.logger.log(`Hot lead alert sent to broker (${brokerPhone}) for lead ${leadJid}`);
    } catch (err) {
      this.logger.error('Failed to send hot lead alert to broker:', err);
    }
  }

  private async handleConsultantHandover(
    userId: string,
    jid: string,
    customerName: string,
    lastMsg: string,
  ) {
    const user = await this.usersService.findById(userId);
    const storeName = user?.storeName || 'nossa imobiliária';

    await this.sendMessage(
      userId,
      jid,
      `Perfeito, *${customerName}*! Já avisei um dos nossos corretores especialistas da equipe da *${storeName}*.\n\nEle vai te chamar por aqui em instantes para te dar atendimento prioritário! 🤝\n\n_(Caso queira reiniciar a consulta automática a qualquer momento, basta digitar "Oi" ou "Voltar")_`,
    );

    this.userStates.set(`${userId}:${jid}`, { mode: 'HANDOVER' });

    // Notifica o corretor no WhatsApp
    if (user && user.phone) {
      const brokerPhone = user.phone.replace(/\D/g, '');
      if (brokerPhone.length >= 10) {
        const brokerJid = `${brokerPhone}@s.whatsapp.net`;
        const leadPhone = jid.replace(/\D/g, '');
        const alert = `🛎️ *SOLICITAÇÃO DE ATENDIMENTO HUMANO!*
──────────────────────
👤 *Cliente:* ${customerName}
📱 *WhatsApp:* wa.me/${leadPhone}
💬 *Mensagem:* "${lastMsg}"
──────────────────────
👉 _O cliente está aguardando você no WhatsApp!_`;
        await this.sendMessage(userId, brokerJid, alert);
      }
    }
  }

  async handleStartScheduling(userId: string, jid: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    const slots = await this.agendaService.getAvailableSlots(userId, startDate, endDate);

    if (slots.length === 0) {
      await this.sendMessage(
        userId,
        jid,
        'Desculpe, não encontrei horários na agenda automática para os próximos dias 😕. Mas nosso corretor pode agendar diretamente com você! Deseja que eu peça para ele te chamar?',
      );
      return;
    }

    let msg = '📅 *Selecione o Dia para sua Visita:*\n\n';
    const weekdays = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];

    slots.forEach((s, index) => {
      const parts = s.date.split('-');
      msg += `*${index + 1}* - ${parts[2]}/${parts[1]} (${weekdays[s.dayOfWeek]})\n`;
    });
    msg += '\nDigite o *número* da data que você prefere.';

    this.userStates.set(`${userId}:${jid}`, {
      mode: 'WAITING_SCHEDULE_DATE',
      slots: slots,
    });
    await this.sendMessage(userId, jid, msg);
  }

  async handleScheduleDateSelection(userId: string, jid: string, input: string) {
    const stateKey = `${userId}:${jid}`;
    const stateData = this.userStates.get(stateKey);
    const slots = stateData?.slots || [];

    const index = parseInt(input) - 1;
    if (isNaN(index) || index < 0 || index >= slots.length) {
      await this.sendMessage(userId, jid, 'Por favor, digite o número correspondente à data desejada.');
      return;
    }

    const selectedSlot = slots[index];
    const parts = selectedSlot.date.split('-');
    let msg = `⏰ *Horários disponíveis para ${parts[2]}/${parts[1]}:*\n\n`;

    selectedSlot.timeSlots.forEach((t: string, i: number) => {
      msg += `*${i + 1}* - ${t}\n`;
    });
    msg += '\nDigite o *número* do horário que fica melhor para você.';

    this.userStates.set(stateKey, {
      ...stateData,
      mode: 'WAITING_SCHEDULE_TIME',
      tempDate: selectedSlot.date,
    });
    await this.sendMessage(userId, jid, msg);
  }

  async handleScheduleTimeSelection(userId: string, jid: string, input: string) {
    const stateKey = `${userId}:${jid}`;
    const stateData = this.userStates.get(stateKey);
    const slots = stateData?.slots || [];
    const dateStr = stateData?.tempDate || '';

    const selectedSlot = slots.find((s: any) => s.date === dateStr);
    if (!selectedSlot) {
      await this.sendMessage(userId, jid, 'Ocorreu um erro no agendamento. Digite *Agendar* para tentar novamente.');
      this.userStates.set(stateKey, { mode: 'CONVERSATIONAL' });
      return;
    }

    const index = parseInt(input) - 1;
    if (isNaN(index) || index < 0 || index >= selectedSlot.timeSlots.length) {
      await this.sendMessage(userId, jid, 'Por favor, escolha um dos números de horários disponíveis.');
      return;
    }

    const time = selectedSlot.timeSlots[index];
    const startDateStr = `${dateStr}T${time}:00`;
    const startObj = new Date(startDateStr);
    const endObj = new Date(startObj.getTime() + 60 * 60 * 1000);

    await this.agendaService.create(userId, {
      title: `Visita WhatsApp - ${jid.split('@')[0]}`,
      start: startObj as any,
      end: endObj as any,
      description: `Agendado via WhatsApp Zapilar por ${jid}`,
      location: 'Imóvel em Goiás',
    });

    const formattedDate = dateStr.split('-').reverse().join('/');
    await this.sendMessage(
      userId,
      jid,
      `✅ *Visita Confirmada com Sucesso!*

📅 *Data:* ${formattedDate}
⏰ *Horário:* ${time}
📍 *Local:* Nosso corretor entrará em contato para confirmar o ponto de encontro.

Muito obrigado! Qualquer dúvida estamos à disposição.`,
    );

    // Alerta o corretor
    const user = await this.usersService.findById(userId);
    if (user && user.phone) {
      const brokerPhone = user.phone.replace(/\D/g, '');
      if (brokerPhone.length >= 10) {
        const brokerJid = `${brokerPhone}@s.whatsapp.net`;
        const leadPhone = jid.replace(/\D/g, '');
        const alert = `📅 *NOVA VISITA AGENDADA VIA BOT!*
──────────────────────
👤 *Cliente:* ${jid.split('@')[0]} (wa.me/${leadPhone})
🗓️ *Data:* ${formattedDate} às ${time}
──────────────────────
👉 _Adicionada à sua agenda Zapilar!_`;
        await this.sendMessage(userId, brokerJid, alert);
      }
    }

    this.userStates.set(stateKey, { mode: 'CONVERSATIONAL' });
  }

  // --- Send Message Primitives ---

  async sendMessage(userId: string, to: string, text: string) {
    const sock = this.sessions.get(userId);
    if (!sock) return;

    let jid = to;
    if (!jid.includes('@')) jid = `${jid.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
      await sock.sendMessage(jid, { text });
      await this.logMessage(
        userId,
        jid,
        'me',
        text,
        'Atendente',
        true,
        undefined,
      );
    } catch (e) {
      this.logger.error('Failed to send text message', e);
    }
  }

  async sendImage(
    userId: string,
    to: string,
    imageUrl: string,
    caption?: string,
  ) {
    const sock = this.sessions.get(userId);
    if (!sock) return;

    let jid = to;
    if (!jid.includes('@')) jid = `${jid.replace(/\D/g, '')}@s.whatsapp.net`;

    try {
      await sock.sendMessage(jid, {
        image: { url: imageUrl },
        caption: caption,
      });
    } catch (e) {
      this.logger.error('Failed to send image', e);
    }
  }

  async sendManualMessage(userId: string, to: string, message: string) {
    await this.sendMessage(userId, to, message);
  }

  private resolveImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;

    const appUrl =
      this.configService.get('APP_URL') ||
      `http://localhost:${process.env.PORT || 3000}`;
    if (!appUrl.endsWith('/') && !imageUrl.startsWith('/'))
      return `${appUrl}/${imageUrl}`;
    return `${appUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  isBotPaused(userId: string): boolean {
    return this.pausedUsers.has(userId);
  }

  setBotPaused(userId: string, paused: boolean) {
    if (paused) this.pausedUsers.add(userId);
    else this.pausedUsers.delete(userId);
  }

  private async logMessage(
    storeId: string,
    contactId: string,
    from: string,
    body: string,
    senderName: string,
    isBot: boolean,
    wamid?: string,
  ) {
    try {
      await this.chatRepository.save({
        storeId,
        contactId,
        from,
        body,
        senderName,
        isBot,
        wamid,
      });
    } catch (e) {
      this.logger.error('Failed to log message', e);
    }
  }

  async getChatHistory(storeId: string, contactId: string) {
    let jid = contactId;
    if (!jid.includes('@')) jid = `${jid.replace(/\D/g, '')}@s.whatsapp.net`;

    return this.chatRepository.find({
      where: { storeId, contactId: jid },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecentChats(storeId: string) {
    const rawChats = await this.chatRepository
      .createQueryBuilder('msg')
      .select('msg.contactId', 'id')
      .addSelect(
        "MAX(CASE WHEN msg.isBot = 0 AND msg.from != 'me' THEN msg.senderName ELSE NULL END)",
        'customerName',
      )
      .addSelect('MAX(msg.createdAt)', 'lastTime')
      .addSelect(
        "MAX(CONCAT(msg.createdAt, '|||', msg.body))",
        'rawLastMessage',
      )
      .where('msg.storeId = :storeId', { storeId })
      .groupBy('msg.contactId')
      .orderBy('lastTime', 'DESC')
      .getRawMany();

    return rawChats.map((chat) => {
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
        lastMessage: body,
      };
    });
  }

  async handleWebhook(payload: any) {}

  async syncSessions() {
    await this.restoreSessions();
  }
}
