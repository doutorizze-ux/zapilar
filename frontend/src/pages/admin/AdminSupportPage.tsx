import { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, Clock, Mail, MessageSquare, Search, Trash2 } from 'lucide-react';

interface SupportTicket {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    subject: string;
    message: string;
    status: 'Aberto' | 'Em Análise' | 'Resolvido';
    createdAt: string;
}

export function AdminSupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [filter, setFilter] = useState('');

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/support`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchTickets();
            }
        } catch (error) {
            alert('Erro ao atualizar status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este ticket?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/support/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setTickets(tickets.filter(t => t.id !== id));
            }
        } catch (error) {
            alert('Erro ao excluir ticket');
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.name.toLowerCase().includes(filter.toLowerCase()) ||
        t.email.toLowerCase().includes(filter.toLowerCase()) ||
        t.subject.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Suporte</h2>
                    <p className="text-gray-500 mt-1">Gerencie as solicitações de suporte dos usuários.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar tickets..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium"
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando tickets...</div>
            ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">Nenhum ticket encontrado</h3>
                    <p className="text-gray-500">Tudo limpo por aqui!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-100 hover:shadow-lg transition-all">
                            <div className="flex flex-col lg:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ticket.status === 'Resolvido'
                                                ? 'bg-green-100 text-green-700'
                                                : ticket.status === 'Em Análise'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                                            {ticket.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                                {ticket.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{ticket.name}</p>
                                                <p className="text-xs">{ticket.email}</p>
                                            </div>
                                        </div>
                                        {ticket.whatsapp && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg text-green-700 font-medium">
                                                <MessageSquare className="w-4 h-4" />
                                                {ticket.whatsapp}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 min-w-[140px]">
                                    {ticket.status !== 'Resolvido' && (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.id, 'Resolvido')}
                                            className="flex-1 lg:flex-none py-2 px-4 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Resolver
                                        </button>
                                    )}

                                    {ticket.status === 'Aberto' && (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.id, 'Em Análise')}
                                            className="flex-1 lg:flex-none py-2 px-4 bg-yellow-500 text-white rounded-xl font-bold text-sm hover:bg-yellow-600 transition-colors"
                                        >
                                            Analisar
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(ticket.id)}
                                        className="flex-1 lg:flex-none py-2 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
