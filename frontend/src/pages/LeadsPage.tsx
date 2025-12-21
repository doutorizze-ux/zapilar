
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, MessageSquare, Phone, Calendar, Plus, Trash2, Car } from 'lucide-react';
import { API_URL } from '../config';
import { CreateLeadModal } from '../components/CreateLeadModal';

interface Lead {
    id: string;
    phone: string;
    name?: string;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
    isHot?: boolean;
    interestSubject?: string;
}

export function LeadsPage() {
    const { token } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
        // Simple formatter, can be improved lib later
        // 5511999999999 -> (11) 99999-9999
        if (phone.length < 10) return phone;
        const ddd = phone.substring(2, 4);
        const prefix = phone.substring(4, 9);
        const suffix = phone.substring(9);
        return `(${ddd}) ${prefix}-${suffix}`;
    };

    const getInitial = (name?: string) => {
        if (name) return name.charAt(0).toUpperCase();
        return '?';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meus Leads</h1>
                    <p className="text-gray-500">Gerencie os contatos capturados pelo seu assistente virtual.</p>
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
                        <thead className="bg-gray-50 border-b border-gray-200 font-medium text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Nome / Contato</th>
                                <th className="px-6 py-4">Última Mensagem</th>
                                <th className="px-6 py-4">Telefone</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {leads.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                                {getInitial(lead.name)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900">{lead.name || 'Desconhecido'}</p>
                                                    {lead.isHot && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-full border border-red-200 flex items-center gap-1">
                                                            🔥 Hot Lead
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">ID: {lead.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 max-w-xs">
                                            {lead.interestSubject && (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-1 rounded w-fit mb-1">
                                                    <Car className="w-3 h-3" />
                                                    {lead.interestSubject}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="truncate text-gray-600" title={lead.lastMessage}>
                                                    {lead.lastMessage && lead.lastMessage.length > 50
                                                        ? lead.lastMessage.substring(0, 50) + '...'
                                                        : lead.lastMessage || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {formatPhone(lead.phone)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {new Date(lead.updatedAt).toLocaleDateString()} <span className="text-xs">{new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <a
                                                href={`https://wa.me/${lead.phone}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors inline-block"
                                            >
                                                Conversar no WhatsApp
                                            </a>
                                            <button
                                                onClick={() => handleDelete(lead.id)}
                                                className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
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
        </div >
    );
}
