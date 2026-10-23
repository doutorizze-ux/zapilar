
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Plus, Trash2, Home, MessageSquare, MoreVertical, CheckCircle2, Phone, Calendar, ArrowRight, LayoutGrid, List, ChevronDown } from 'lucide-react';
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
    { id: 'NEW', label: 'Novos', color: 'bg-emerald-100/50 text-emerald-800', dot: 'bg-emerald-500' },
    { id: 'CONTACTED', label: 'Em Contato', color: 'bg-blue-100/50 text-blue-800', dot: 'bg-blue-500' },
    { id: 'VISIT', label: 'Visita', color: 'bg-purple-100/50 text-purple-800', dot: 'bg-purple-500' },
    { id: 'PROPOSAL', label: 'Proposta', color: 'bg-orange-100/50 text-orange-800', dot: 'bg-orange-500' },
    { id: 'CLOSED', label: 'Fechado', color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
];

export function LeadsPage() {
    const { token } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedChatLead, setSelectedChatLead] = useState<Lead | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>(() => {
        // Mobile defaults to list, desktop to kanban
        return window.innerWidth < 768 ? 'list' : 'kanban';
    });
    const [activeFilter, setActiveFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchLeads();
    }, []);

    // Auto-switch view on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768 && viewMode === 'kanban') {
                setViewMode('list');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [viewMode]);

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
        handleUpdateStatus(id, 'ARCHIVED');
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

    const getFilteredLeads = () => {
        if (activeFilter === 'ALL') return leads.filter(l => (l.column || 'NEW') !== 'ARCHIVED');
        if (activeFilter === 'HOT') return leads.filter(l => l.isHot);
        return leads.filter(l => (l.column || 'NEW') === activeFilter);
    };

    if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;

    const formatPhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 12) return cleaned;
        const ddd = cleaned.substring(2, 4);
        const prefix = cleaned.substring(4, 9);
        const suffix = cleaned.substring(9);
        return `(${ddd}) ${prefix}-${suffix}`;
    };

    const hotCount = leads.filter(l => l.isHot).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Cérebro de Vendas</h1>
                    <p className="text-gray-500 text-sm">Acompanhe seus clientes do primeiro contato ao fechamento.</p>
                </div>
                <div className="flex gap-2">
                    {/* View toggle - hidden on very small screens */}
                    <div className="hidden sm:flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition ${viewMode === 'kanban' ? 'bg-white shadow text-cyan-700' : 'text-gray-400'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-cyan-700' : 'text-gray-400'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Novo Lead</span>
                        <span className="sm:hidden">Novo</span>
                    </button>
                </div>
            </div>

            {/* Mobile Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none -mx-1 px-1">
                <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${activeFilter === 'ALL' ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    Todos ({leads.filter(l => (l.column || 'NEW') !== 'ARCHIVED').length})
                </button>
                <button
                    onClick={() => setActiveFilter('HOT')}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition ${activeFilter === 'HOT' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    🔥 Quentes ({hotCount})
                </button>
                {COLUMNS.map(col => (
                    <button
                        key={col.id}
                        onClick={() => setActiveFilter(col.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${activeFilter === col.id ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        {col.label} ({getColumnLeads(col.id).length})
                    </button>
                ))}
            </div>

            {/* KANBAN VIEW (Desktop) */}
            {viewMode === 'kanban' && (
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
                                            compact={false}
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
            )}

            {/* LIST VIEW (Mobile-first) */}
            {viewMode === 'list' && (
                <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                    {getFilteredLeads().length === 0 && (
                        <div className="text-center py-16 text-gray-400">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Nenhum lead encontrado</p>
                            <p className="text-sm mt-1">Leads aparecerão aqui quando clientes falarem no WhatsApp</p>
                        </div>
                    )}
                    {getFilteredLeads().map(lead => (
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
                            compact={true}
                        />
                    ))}
                </div>
            )}

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

function LeadCard({ lead, onMove, onDelete, onChat, formatPhone, compact }: any) {
    const [menuOpen, setMenuOpen] = useState(false);
    const colObj = COLUMNS.find(c => c.id === (lead.column || 'NEW'));

    // Compact mode = mobile list view
    if (compact) {
        return (
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 transition relative">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-gray-900 truncate">{lead.name || 'Desconhecido'}</p>
                            {lead.isHot && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-black flex-shrink-0">🔥</span>}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{lead.interestSubject || lead.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${colObj?.color || 'bg-gray-100 text-gray-600'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colObj?.dot}`} />
                                {colObj?.label}
                            </span>
                            {lead.budget && (
                                <span className="text-[10px] text-gray-500">💰 {lead.budget}</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                        <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                        >
                            <Phone className="w-4 h-4" />
                        </a>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Expandable menu */}
                {menuOpen && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <button onClick={() => { onChat(); setMenuOpen(false); }} className="text-xs font-medium text-gray-600 bg-gray-50 py-2 rounded-lg hover:bg-gray-100 transition">
                                💬 Ver Conversa
                            </button>
                            <button onClick={() => { onDelete(); setMenuOpen(false); }} className="text-xs font-medium text-red-600 bg-red-50 py-2 rounded-lg hover:bg-red-100 transition">
                                🗑️ Arquivar
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Mover para:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {COLUMNS.map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => { onMove(col.id); setMenuOpen(false); }}
                                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                                        (lead.column || 'NEW') === col.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${(lead.column || 'NEW') === col.id ? 'bg-white' : col.dot}`} />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Full card mode (Kanban)
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
