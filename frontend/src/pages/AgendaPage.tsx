import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Clock, MapPin } from 'lucide-react';

export function AgendaPage() {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', start: '', end: '', location: '', description: '' });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/agenda`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setEvents(await res.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/agenda`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            setFormData({ title: '', start: '', end: '', location: '', description: '' });
            fetchEvents();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apagar evento?')) return;
        await fetch(`${import.meta.env.VITE_API_URL}/agenda/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchEvents();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Agenda de Compromissos</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Novo Evento
                </button>
            </div>

            <div className="space-y-4">
                {events.map((event: any) => (
                    <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 text-center min-w-[60px]">
                                <div className="text-xs uppercase font-bold">{new Date(event.start).toLocaleString('pt-BR', { month: 'short' })}</div>
                                <div className="text-xl font-bold">{new Date(event.start).getDate()}</div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    {event.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</div>}
                                </div>
                                {event.description && <p className="text-gray-600 text-sm mt-2">{event.description}</p>}
                            </div>
                        </div>
                        <button onClick={() => handleDelete(event.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        Nenhum compromisso agendado.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Novo Compromisso</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                    <input type="datetime-local" value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fim (Opcional)</label>
                                    <input type="datetime-local" value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                                <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Adicionar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
