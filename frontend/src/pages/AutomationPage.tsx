import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import {
  Zap,
  Clock,
  Users,
  Bell,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  Flame,
  Home,
  CalendarClock,
  MessageCircle,
  FileText,
} from 'lucide-react';

interface AutomationStats {
  settings: {
    followUpEnabled: boolean;
    followUpDays: number;
    matchAlertEnabled: boolean;
    visitReminderEnabled: boolean;
    weeklyReportEnabled: boolean;
    postVisitEnabled: boolean;
  };
  stats: {
    coldLeadsWaiting: number;
    upcomingVisitsToday: number;
    newLeadsThisWeek: number;
    hotLeads: number;
    totalLeads: number;
  };
}

interface ColdLead {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  updatedAt: string;
}

export function AutomationPage() {
  const [data, setData] = useState<AutomationStats | null>(null);
  const [coldLeads, setColdLeads] = useState<ColdLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportText, setReportText] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [statsRes, coldRes] = await Promise.all([
        fetch(`${API_URL}/automation/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/automation/cold-leads`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (statsRes.ok) setData(await statsRes.json());
      if (coldRes.ok) setColdLeads(await coldRes.json());
    } catch (e) {
      console.error('Error fetching automation data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSetting = async (key: string, value: boolean) => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/automation/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData((prev) =>
          prev ? { ...prev, settings: updated } : prev,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updateFollowUpDays = async (days: number) => {
    if (!data) return;
    try {
      const res = await fetch(`${API_URL}/automation/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followUpDays: days }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData((prev) =>
          prev ? { ...prev, settings: updated } : prev,
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    setReportText(null);
    try {
      const res = await fetch(`${API_URL}/automation/weekly-report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setReportText(d.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  const settings = data?.settings;
  const stats = data?.stats;

  const automations = [
    {
      key: 'followUpEnabled',
      icon: MessageCircle,
      title: 'Follow-up Automático',
      description: `Sofia envia mensagem para leads que não responderam há ${settings?.followUpDays || 3} dias`,
      enabled: settings?.followUpEnabled ?? true,
      color: 'cyan',
      stat: `${stats?.coldLeadsWaiting || 0} leads aguardando`,
    },
    {
      key: 'matchAlertEnabled',
      icon: Home,
      title: 'Alerta de Match',
      description: 'Quando um novo imóvel é cadastrado, avisa automaticamente os leads interessados',
      enabled: settings?.matchAlertEnabled ?? true,
      color: 'purple',
      stat: `${stats?.totalLeads || 0} leads no banco`,
    },
    {
      key: 'visitReminderEnabled',
      icon: CalendarClock,
      title: 'Lembrete de Visita',
      description: '1 hora antes da visita, Sofia lembra o cliente pelo WhatsApp',
      enabled: settings?.visitReminderEnabled ?? true,
      color: 'orange',
      stat: `${stats?.upcomingVisitsToday || 0} visitas próximas`,
    },
    {
      key: 'weeklyReportEnabled',
      icon: BarChart3,
      title: 'Relatório Semanal',
      description: 'Todo domingo às 8h, envia resumo da semana no WhatsApp do corretor',
      enabled: settings?.weeklyReportEnabled ?? true,
      color: 'green',
      stat: `${stats?.newLeadsThisWeek || 0} leads esta semana`,
    },
    {
      key: 'postVisitEnabled',
      icon: FileText,
      title: 'Pós-Visita',
      description: 'Após uma visita, Sofia pergunta ao cliente o que achou e se quer mais opções',
      enabled: settings?.postVisitEnabled ?? true,
      color: 'pink',
      stat: 'Automático',
    },
  ];

  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-700',
    purple: 'from-purple-500 to-purple-700',
    orange: 'from-orange-500 to-orange-700',
    green: 'from-green-500 to-green-700',
    pink: 'from-pink-500 to-pink-700',
  };

  const bgMap: Record<string, string> = {
    cyan: 'bg-cyan-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
    pink: 'bg-pink-50',
  };

  const daysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'hoje';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-cyan-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Automações</h1>
          </div>
          <p className="text-cyan-100 max-w-xl">
            O Zapilar trabalha por você 24 horas. Follow-up, lembrete de visita, alerta de match — tudo automático no WhatsApp.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Leads Quentes', value: stats?.hotLeads ?? 0, icon: Flame, color: 'text-red-600 bg-red-50' },
          { label: 'Novos (7 dias)', value: stats?.newLeadsThisWeek ?? 0, icon: Users, color: 'text-cyan-600 bg-cyan-50' },
          { label: 'Aguardando Retorno', value: stats?.coldLeadsWaiting ?? 0, icon: Clock, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total de Leads', value: stats?.totalLeads ?? 0, icon: Bell, color: 'text-purple-600 bg-purple-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Automation Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-cyan-600" />
          Configurar Automações
        </h2>

        <div className="grid gap-4">
          {automations.map((auto) => (
            <div
              key={auto.key}
              className={`bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow ${
                !auto.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[auto.color]} text-white`}>
                  <auto.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    {auto.title}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${auto.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {auto.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{auto.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {auto.stat}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Follow-up days selector */}
                {auto.key === 'followUpEnabled' && auto.enabled && (
                  <select
                    value={settings?.followUpDays || 3}
                    onChange={(e) => updateFollowUpDays(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value={1}>1 dia</option>
                    <option value={2}>2 dias</option>
                    <option value={3}>3 dias</option>
                    <option value={5}>5 dias</option>
                    <option value={7}>7 dias</option>
                  </select>
                )}

                <button
                  onClick={() => toggleSetting(auto.key, !auto.enabled)}
                  disabled={saving}
                  className="transition-colors"
                >
                  {auto.enabled ? (
                    <ToggleRight className="w-10 h-10 text-cyan-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cold Leads Section */}
      {coldLeads.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Leads Aguardando Follow-up ({coldLeads.length})
          </h2>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {coldLeads.slice(0, 10).map((lead) => (
              <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{lead.name || lead.phone}</p>
                  <p className="text-sm text-gray-500 truncate max-w-[300px]">{lead.lastMessage}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                    Há {daysAgo(lead.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Report Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Relatório Semanal
          </h2>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {generatingReport ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {generatingReport ? 'Gerando...' : 'Gerar Prévia'}
          </button>
        </div>

        {reportText && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 whitespace-pre-wrap text-sm text-gray-800 font-mono">
            {reportText}
          </div>
        )}

        {!reportText && (
          <p className="text-sm text-gray-500">
            Clique em "Gerar Prévia" para ver como ficará o relatório enviado ao corretor todo domingo.
          </p>
        )}
      </div>
    </div>
  );
}
