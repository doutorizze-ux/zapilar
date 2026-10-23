import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Lead } from '../leads/entities/lead.entity';
import { Event } from '../agenda/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';
import { AiService } from '../integrations/ai/ai.service';

export interface AutomationSettings {
  followUpEnabled: boolean;
  followUpDays: number;
  matchAlertEnabled: boolean;
  visitReminderEnabled: boolean;
  weeklyReportEnabled: boolean;
  postVisitEnabled: boolean;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  // In-memory store for per-user automation settings
  // In a real production system, persist to DB. Here, defaults work on restart.
  private settingsMap: Map<string, AutomationSettings> = new Map();

  constructor(
    @InjectRepository(Lead)
    private leadsRepo: Repository<Lead>,
    @InjectRepository(Event)
    private eventsRepo: Repository<Event>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Property)
    private propertiesRepo: Repository<Property>,
    private aiService: AiService,
  ) {}

  getSettings(userId: string): AutomationSettings {
    return this.settingsMap.get(userId) ?? {
      followUpEnabled: true,
      followUpDays: 3,
      matchAlertEnabled: true,
      visitReminderEnabled: true,
      weeklyReportEnabled: true,
      postVisitEnabled: true,
    };
  }

  updateSettings(userId: string, settings: Partial<AutomationSettings>): AutomationSettings {
    const current = this.getSettings(userId);
    const updated = { ...current, ...settings };
    this.settingsMap.set(userId, updated);
    return updated;
  }

  // ─── 1. FOLLOW-UP AUTOMÁTICO ────────────────────────────────────────────────
  /**
   * Returns leads that haven't been contacted in X days (cold leads).
   * The WhatsApp bot will use this list to send follow-up messages.
   */
  async getColdLeads(userId: string): Promise<Lead[]> {
    const settings = this.getSettings(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.followUpDays);

    return this.leadsRepo.find({
      where: {
        storeId: userId,
        updatedAt: LessThan(cutoff),
      },
      order: { updatedAt: 'ASC' },
      take: 20,
    });
  }

  async generateFollowUpMessage(lead: Lead, agentName: string): Promise<string> {
    try {
      const name = lead.name ? lead.name.split(' ')[0] : 'olá';
      const interest = lead.interestSubject || lead.lastMessage || 'imóveis';
      const prompt = `Você é ${agentName}, consultora imobiliária especialista em Goiás.
Gere uma mensagem de follow-up curta, calorosa e natural para um cliente que não respondeu há alguns dias.
Nome do cliente: ${name}
Último interesse dele: ${interest}
A mensagem deve ser informal, brasileira, com emoji, máximo 2 linhas. NÃO use saudação formal.
Retorne APENAS o texto da mensagem, sem aspas.`;
      const msg = await this.aiService.generateCompletion(prompt, 'gere agora');
      return msg || `Oi ${name}! 😊 Ainda está procurando imóvel? Tenho novidades que podem te interessar!`;
    } catch {
      const name = lead.name ? lead.name.split(' ')[0] : '';
      return `Oi${name ? ' ' + name : ''}! 😊 Ainda está procurando imóvel? Tenho novidades que podem te interessar!`;
    }
  }

  // ─── 2. MATCH AUTOMÁTICO ────────────────────────────────────────────────────
  /**
   * When a new property is registered, find leads that might be interested.
   */
  async findMatchingLeadsForProperty(
    userId: string,
    property: Property,
  ): Promise<Lead[]> {
    const allLeads = await this.leadsRepo.find({ where: { storeId: userId } });
    const type = (property.type || '').toLowerCase();
    const city = (property.city || '').toLowerCase();
    const neighborhood = (property.neighborhood || '').toLowerCase();

    return allLeads.filter((lead) => {
      const text = `${lead.interestSubject || ''} ${lead.lastMessage || ''}`.toLowerCase();
      const wantsType = type && text.includes(type);
      const wantsLocation = (city && text.includes(city)) || (neighborhood && text.includes(neighborhood));
      // Match if lead mentioned the property type OR location
      return wantsType || wantsLocation;
    });
  }

  async generateMatchMessage(lead: Lead, property: Property, agentName: string): Promise<string> {
    try {
      const name = lead.name ? lead.name.split(' ')[0] : '';
      const price = Number(property.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const prompt = `Você é ${agentName}, consultora imobiliária de Goiás.
Gere uma mensagem WhatsApp curta e animada avisando sobre um novo imóvel que combina com o interesse do cliente.
Cliente: ${name || 'cliente'}
Imóvel: ${property.type} em ${property.neighborhood || property.city}, ${price}
${property.acceptsTrade ? 'Aceita permuta.' : ''}
${property.isGatedCommunity ? 'Condomínio fechado.' : ''}
Máximo 3 linhas, com emoji, informal. Retorne APENAS o texto.`;
      const msg = await this.aiService.generateCompletion(prompt, 'gere agora');
      return msg || `Oi${name ? ' ' + name : ''}! 🏠 Chegou um imóvel novo que pode te interessar: ${property.type} em ${property.neighborhood || property.city} por ${price}. Quer saber mais?`;
    } catch {
      const name = lead.name ? lead.name.split(' ')[0] : '';
      const price = Number(property.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return `Oi${name ? ' ' + name : ''}! 🏠 Chegou um novo imóvel: ${property.type} em ${property.neighborhood || property.city} por ${price}. Interesse?`;
    }
  }

  // ─── 3. LEMBRETES DE VISITA ─────────────────────────────────────────────────
  /**
   * Returns events happening in the next 1 hour that haven't been reminded yet.
   * Looks for events with client phone in description/title (format: "PHONE:5562999...")
   */
  async getUpcomingVisits(userId: string): Promise<Event[]> {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return this.eventsRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.start >= :from', { from: inOneHour })
      .andWhere('event.start <= :to', { to: inTwoHours })
      .andWhere("event.description LIKE '%PHONE:%'")
      .andWhere("(event.description NOT LIKE '%REMINDER_SENT%')")
      .getMany();
  }

  extractPhoneFromEvent(event: Event): string | null {
    const match = (event.description || '').match(/PHONE:([\d]+)/);
    return match ? match[1] : null;
  }

  async markReminderSent(eventId: string): Promise<void> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (event) {
      event.description = (event.description || '') + ' REMINDER_SENT';
      await this.eventsRepo.save(event);
    }
  }

  generateVisitReminderMessage(event: Event, agentName: string): string {
    const time = new Date(event.start).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const location = event.location || 'o imóvel combinado';
    return `🏠 Olá! Passando pra lembrar da sua visita hoje às *${time}* em ${location}. Nossa consultora ${agentName} estará te esperando! Qualquer dúvida é só falar 😊`;
  }

  // ─── 4. RELATÓRIO SEMANAL ───────────────────────────────────────────────────
  async generateWeeklyReport(userId: string): Promise<string> {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const allLeads = await this.leadsRepo.find({ where: { storeId: userId } });
    const newLeads = allLeads.filter(l => new Date(l.createdAt) >= since).length;
    const hotLeads = allLeads.filter(l => l.isHot).length;
    const closedLeads = allLeads.filter(l => l.column === 'CLOSED').length;

    const visitLeads = allLeads.filter(l => l.column === 'VISIT').length;
    const proposalLeads = allLeads.filter(l => l.column === 'PROPOSAL').length;

    // Find leads waiting > 2 days without response
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const waitingLeads = allLeads.filter(l =>
      new Date(l.updatedAt) < twoDaysAgo &&
      l.column !== 'CLOSED' &&
      l.column !== 'ARCHIVED' &&
      l.isHot
    );

    const properties = await this.propertiesRepo.count({ where: { userId } });

    let report = `📊 *Seu relatório semanal — Zapilar*\n\n`;
    report += `🆕 Novos leads: *${newLeads}*\n`;
    report += `🔥 Leads quentes: *${hotLeads}*\n`;
    report += `🏠 Em visita: *${visitLeads}*\n`;
    report += `📝 Em proposta: *${proposalLeads}*\n`;
    report += `✅ Fechados: *${closedLeads}*\n`;
    report += `🏡 Imóveis ativos: *${properties}*\n`;

    if (waitingLeads.length > 0) {
      report += `\n⚠️ *Atenção!* ${waitingLeads.length} lead(s) quente(s) aguardando retorno há mais de 2 dias:\n`;
      waitingLeads.slice(0, 3).forEach(l => {
        const name = l.name || l.phone;
        report += `• ${name}\n`;
      });
    }

    report += `\n_Enviado automaticamente pelo Zapilar_ 🤖`;
    return report;
  }

  // ─── 5. PÓS-VISITA ─────────────────────────────────────────────────────────
  /**
   * Returns events that ended 2-4 hours ago and haven't had post-visit message sent.
   */
  async getCompletedVisitsForFollowup(userId: string): Promise<Event[]> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    return this.eventsRepo
      .createQueryBuilder('event')
      .where('event.userId = :userId', { userId })
      .andWhere('event.start >= :from', { from: fourHoursAgo })
      .andWhere('event.start <= :to', { to: twoHoursAgo })
      .andWhere("event.description LIKE '%PHONE:%'")
      .andWhere("(event.description NOT LIKE '%POSTVISIT_SENT%')")
      .getMany();
  }

  async markPostVisitSent(eventId: string): Promise<void> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (event) {
      event.description = (event.description || '') + ' POSTVISIT_SENT';
      await this.eventsRepo.save(event);
    }
  }

  generatePostVisitMessage(event: Event, agentName: string): string {
    const property = event.location || 'o imóvel';
    return `Oi! 😊 Tudo bem? Sou ${agentName}. O que achou de ${property}? Ficou interessado(a)? Posso te mandar mais opções parecidas ou tirar qualquer dúvida sobre financiamento e valores. É só falar! 🏠`;
  }

  // ─── MANUAL TRIGGER: Run all automations for a user ─────────────────────────
  async getAutomationStats(userId: string) {
    const settings = this.getSettings(userId);
    const coldLeads = await this.getColdLeads(userId);
    const upcomingVisits = await this.getUpcomingVisits(userId);
    const allLeads = await this.leadsRepo.find({ where: { storeId: userId } });

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const newThisWeek = allLeads.filter(l => new Date(l.createdAt) >= since).length;
    const hotCount = allLeads.filter(l => l.isHot).length;

    return {
      settings,
      stats: {
        coldLeadsWaiting: coldLeads.length,
        upcomingVisitsToday: upcomingVisits.length,
        newLeadsThisWeek: newThisWeek,
        hotLeads: hotCount,
        totalLeads: allLeads.length,
      },
    };
  }
}
