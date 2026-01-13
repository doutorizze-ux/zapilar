
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Trash2, Home, MessageSquare, MoreVertical, CheckCircle2, Phone, Calendar, ArrowRight } from 'lucide-react';
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
    column?: string; // NEW, CONTACTED, VISIT, PROPOSAL, CLOSED, ARCHIVED
}

const COLUMNS = [
    { id: 'NEW', label: 'Novos', color: 'bg-emerald-100/50 text-emerald-800' },
    { id: 'CONTACTED', label: 'Em Contato', color: 'bg-blue-100/50 text-blue-800' },
    { id: 'VISIT', label: 'Visita', color: 'bg-purple-100/50 text-purple-800' },
    { id: 'PROPOSAL', label: 'Proposta', color: 'bg-orange-100/50 text-orange-800' },
    { id: 'CLOSED', label: 'Fechado', color: 'bg-green-100 text-green-800 border-green-200' },
];

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

    const handleUpdateStatus = async (id: string, newColumn: string) => {
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === id ? { ...l, column: newColumn } : l));

        try {
            await fetch(`${API_URL}/leads/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ column: newColumn })
            });
        } catch (error) {
            console.error('Failed to update status', error);
            fetchLeads(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja arquivar este lead?')) return;
        handleUpdateStatus(id, 'ARCHIVED'); // Soft delete visuals
        // Or hard delete:
        try {
            await fetch(`${API_URL}/leads/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const getColumnLeads = (colId: string) => {
        return leads.filter(l => (l.column || 'NEW') === colId);
    };

    if (loading) return <div>Carregando...</div>;

    const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 12) return cleaned;
        const ddd = cleaned.substring(2, 4);
        const prefix = cleaned.substring(4, 9);
        const suffix = cleaned.substring(9);
        return `(${ddd}) ${prefix}-${suffix}`;
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cérebro de Vendas (Kanban)</h1>
                    <p className="text-gray-500">Arraste seus clientes até o fechamento.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Lead
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1200px] h-full">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex-1 flex flex-col bg-gray-50/80 rounded-2xl border border-gray-200/60 min-w-[280px]">
                            <div className={`p-3 border-b border-gray-200 flex justify-between items-center rounded-t-2xl font-bold ${col.color}`}>
                                <h3 className="text-sm uppercase tracking-wide">{col.label}</h3>
                                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">{getColumnLeads(col.id).length}</span>
                            </div>
                            <div className="flex-1 p-2 overflow-y-auto space-y-2.5">
                                {getColumnLeads(col.id).map(lead => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        onMove={(newCol) => handleUpdateStatus(lead.id, newCol)}
                                        onDelete={() => handleDelete(lead.id)}
                                        onChat={() => {
                                            setSelectedChatLead(lead);
                                            setIsChatModalOpen(true);
                                        }}
                                        formatPhone={formatPhone}
                                    />
                                ))}
                                {getColumnLeads(col.id).length === 0 && (
                                    <div className="text-center py-10 text-gray-400 text-xs italic border-2 border-dashed border-gray-200 rounded-xl m-2">
                                        Vazio
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CreateLeadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchLeads}
            />

            <ChatHistoryModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                lead={selectedChatLead}
                token={token}
            />
        </div>
    );
}

function LeadCard({ lead, onMove, onDelete, onChat, formatPhone }: any) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900 line-clamp-1" title={lead.name}>{lead.name || 'Desconhecido'}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{formatPhone(lead.phone)}</p>
                    </div>
                </div>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-gray-50 rounded text-gray-400">
                    <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                    <div className="absolute right-2 top-8 bg-white border border-gray-200 shadow-xl rounded-lg z-50 w-40 py-1 flex flex-col text-xs">
                        <button onClick={() => { onMove('NEW'); setMenuOpen(false); }} className="px-3 py-2 hover:bg-gray-50 text-left">Mover para Novos</button>
                        <button onClick={() => { onMove('CONTACTED'); setMenuOpen(false); }} className="px-3 py-2 hover:bg-gray-50 text-left">Mover para Contatado</button>
                        <button onClick={() => { onMove('VISIT'); setMenuOpen(false); }} className="px-3 py-2 hover:bg-gray-50 text-left">Mover para Visita</button>
                        <button onClick={() => { onMove('PROPOSAL'); setMenuOpen(false); }} className="px-3 py-2 hover:bg-gray-50 text-left text-orange-600 font-bold">Mover para Proposta</button>
                        <button onClick={() => { onMove('CLOSED'); setMenuOpen(false); }} className="px-3 py-2 hover:bg-gray-50 text-left text-green-600 font-bold">Mover para Fechado</button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button onClick={() => onDelete()} className="px-3 py-2 hover:bg-red-50 text-left text-red-600">Arquivar Lead</button>
                    </div>
                )}
            </div>

            {lead.isHot && (
                <div className="mb-2">
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded border border-red-100 flex items-center gap-1 w-fit">
                        🔥 Alta Intenção
                    </span>
                </div>
            )}

            <div className="space-y-2 mb-3">
                {lead.budget && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">
                        <span className="font-bold text-gray-800">💰</span> {lead.budget}
                    </div>
                )}
                {lead.interestSubject && (
                    <div className="flex items-center gap-1.5 text-xs text-cyan-700 font-medium">
                        <Home className="w-3 h-3" />
                        <span className="line-clamp-1">{lead.interestSubject}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex justify-center items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 py-1.5 rounded-lg transition-colors border border-green-200"
                >
                    <Phone className="w-3 h-3" /> WhatsApp
                </a>
                <button
                    onClick={onChat}
                    className="flex-1 flex justify-center items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg transition-colors border border-gray-200"
                >
                    <MessageSquare className="w-3 h-3" /> Conversa
                </button>
            </div>

            {/* Quick Move Arrows */}
            {lead.column !== 'CLOSED' && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 hover:scale-110">
                    <button
                        onClick={() => {
                            const order = ['NEW', 'CONTACTED', 'VISIT', 'PROPOSAL', 'CLOSED'];
                            const idx = order.indexOf(lead.column || 'NEW');
                            if (idx < order.length - 1) onMove(order[idx + 1]);
                        }}
                        className="bg-white shadow-md border border-gray-200 rounded-full p-1.5 text-gray-500 hover:text-cyan-600 hover:border-cyan-200"
                        title="Avançar etapa"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
