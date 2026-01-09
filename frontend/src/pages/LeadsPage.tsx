
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Trash2, Home, MessageSquare } from 'lucide-react';
import { API_URL } from '../config';
import { CreateLeadModal } from '../components/CreateLeadModal';
import { ChatHistoryModal } from '../components/ChatHistoryModal';

interface Lead {
    id: string;
    phone: string;
    name?: string;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
    isHot?: boolean;
    interestSubject?: string;
    budget?: string;
    financing?: string;
    motivation?: string;
    urgency?: string;
    aiNotes?: string;
}

export function LeadsPage() {
    const { token } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedChatLead, setSelectedChatLead] = useState<Lead | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${API_URL}/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este lead?')) return;

        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchLeads();
            } else {
                alert('Erro ao excluir lead');
            }
        } catch (error) {
            console.error('Failed to delete lead', error);
        }
    };

    if (loading) return <div>Carregando...</div>;

    const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        // 5511999999999 -> (11) 99999-9999
        if (cleaned.length < 12) return cleaned;
        const ddd = cleaned.substring(2, 4);
        const prefix = cleaned.substring(4, 9);
        const suffix = cleaned.substring(9);
        return `(${ddd}) ${prefix}-${suffix}`;
    };

    const getInitial = (name?: string) => {
        if (name) return name.charAt(0).toUpperCase();
        return '?';
    };

    const getUrgencyColor = (u?: string) => {
        if (!u) return 'bg-gray-100 text-gray-600';
        if (u.toLowerCase().includes('immedia')) return 'bg-red-100 text-red-700 border-red-200';
        if (u.toLowerCase().includes('soon')) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cérebro de Vendas (CRM)</h1>
                    <p className="text-gray-500">Qualificação automática por IA e gestão de oportunidades.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 flex items-center">
                        Total: {leads.length}
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Lead
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Nome / Contato</th>
                                <th className="px-6 py-4">Qualificação IA</th>
                                <th className="px-6 py-4">Contexto & Conversa</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                                                {getInitial(lead.name)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900">{lead.name || 'Desconhecido'}</p>
                                                    {lead.isHot && (
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase rounded shadow-sm">
                                                            HOT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">{formatPhone(lead.phone)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                            {lead.budget && (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded border border-green-100 flex items-center gap-1">
                                                    💰 {lead.budget}
                                                </span>
                                            )}
                                            {lead.motivation && (
                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                                                    🎯 {lead.motivation === 'Living' ? 'Moradia' : 'Investimento'}
                                                </span>
                                            )}
                                            {lead.urgency && (
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded border ${getUrgencyColor(lead.urgency)}`}>
                                                    ⏳ {lead.urgency}
                                                </span>
                                            )}
                                            {!lead.budget && !lead.motivation && !lead.urgency && (
                                                <span className="text-gray-400 italic text-xs">Pendente...</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 max-w-xs">
                                            {lead.interestSubject && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 mb-1">
                                                    <Home className="w-3 h-3" />
                                                    {lead.interestSubject}
                                                </div>
                                            )}
                                            <div
                                                className="bg-gray-50 p-2 rounded-lg border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/30 cursor-pointer transition-all group/msg"
                                                onClick={() => {
                                                    setSelectedChatLead(lead);
                                                    setIsChatModalOpen(true);
                                                }}
                                            >
                                                <p className="text-xs text-gray-600 line-clamp-2 italic group-hover/msg:text-cyan-700">
                                                    "{lead.lastMessage || '-'}"
                                                </p>
                                                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                    <MessageSquare className="w-3 h-3 text-cyan-600" />
                                                    <span className="text-[10px] font-bold text-cyan-600 uppercase">Ver todas</span>
                                                </div>
                                            </div>
                                            {lead.aiNotes && (
                                                <p className="text-[10px] text-gray-400 font-medium mt-1 truncate" title={lead.aiNotes}>
                                                    🤖 {lead.aiNotes}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                                        <div className="flex flex-col">
                                            <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
                                            <span className="text-[10px] opacity-70">{new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <a
                                                href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-800 font-bold text-[10px] uppercase border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors inline-block"
                                            >
                                                WhatsApp
                                            </a>
                                            <button
                                                onClick={() => {
                                                    setSelectedChatLead(lead);
                                                    setIsChatModalOpen(true);
                                                }}
                                                className="text-cyan-600 hover:text-cyan-800 font-bold text-[10px] uppercase border border-cyan-200 bg-cyan-50 px-3 py-1.5 rounded-lg hover:bg-cyan-100 transition-colors inline-block"
                                            >
                                                Conversa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                                <User className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="font-medium">Nenhum lead encontrado.</p>
                                            <p className="text-sm">Compartilhe seu link ou aguarde contatos no WhatsApp.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    fetchLeads();
                }}
            />

            <ChatHistoryModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                lead={selectedChatLead}
                token={token}
            />
        </div >
    );
}
