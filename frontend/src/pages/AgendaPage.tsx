import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Clock, MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export function AgendaPage() {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', start: '', end: '', location: '', description: '' });

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

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

    // --- Calendar Logic ---
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100"></div>);
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayEvents = events.filter((e: any) => e.start.startsWith(dateStr));
        const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();
        const isSelected = selectedDate.toDateString() === new Date(year, month, i).toDateString();

        days.push(
            <div
                key={i}
                onClick={() => setSelectedDate(new Date(year, month, i))}
                className={`h-24 border border-gray-100 p-2 cursor-pointer transition-colors relative group
                    ${isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 bg-white'}
                `}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-green-600 text-white' : 'text-gray-700'}
                    `}>
                        {i}
                    </span>
                    {dayEvents.length > 0 && (
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                            {dayEvents.length}
                        </span>
                    )}
                </div>
                <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map((ev: any) => (
                        <div key={ev.id} className="text-[10px] truncate bg-gray-100 text-gray-700 px-1 rounded">
                            {ev.title}
                        </div>
                    ))}
                    {dayEvents.length > 2 && (
                        <div className="text-[10px] text-gray-400 pl-1">+ {dayEvents.length - 2} mais</div>
                    )}
                </div>
            </div>
        );
    }

    // Filter events for the selected date list view
    const selectedDateEvents = events.filter((e: any) => {
        const eventDate = new Date(e.start);
        return eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear();
    });

    const openNewEventModal = () => {
        // Pre-fill with selected date at current time (or 09:00)
        const now = new Date();
        const start = new Date(selectedDate);
        start.setHours(now.getHours(), now.getMinutes());

        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const toLocalISO = (d: Date) => {
            const pad = (n: number) => n < 10 ? '0' + n : n;
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        };

        setFormData({
            title: '',
            start: toLocalISO(start),
            end: '',
            location: '',
            description: ''
        });
        setIsModalOpen(true);
    }

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-green-600" />
                    Agenda de Compromissos
                </h1>
                <button
                    onClick={openNewEventModal}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> Novo Evento
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid - Takes up 2/3 columns */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Calendar Header */}
                    <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800 capitalize">
                            {monthNames[month]} <span className="text-gray-500 font-normal">{year}</span>
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all text-gray-600">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                                Hoje
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all text-gray-600">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7">
                        {days}
                    </div>
                </div>

                {/* Sidebar - Selected Date Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[600px]">
                    <div className="p-4 border-b border-gray-100 bg-green-50/50">
                        <h3 className="font-bold text-gray-800">
                            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {selectedDateEvents.length} compromisso(s) agendado(s)
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedDateEvents.length > 0 ? selectedDateEvents.map((event: any) => (
                            <div key={event.id} className="group flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all">
                                <div className="min-w-[50px] text-center">
                                    <span className="block text-sm font-bold text-gray-900">
                                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {event.end && (
                                        <span className="block text-xs text-gray-400">
                                            {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h4>
                                    {event.location && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                            <MapPin className="w-3 h-3" /> {event.location}
                                        </div>
                                    )}
                                    {event.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400 space-y-3">
                                <CalendarIcon className="w-12 h-12 opacity-20" />
                                <p className="text-sm">Nenhum compromisso para este dia.</p>
                                <button onClick={openNewEventModal} className="text-sm text-green-600 font-medium hover:underline">
                                    Adicionar novo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Novo Compromisso</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Trash2 className="w-5 h-5 opacity-0 cursor-default" /> {/* Spacer */}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                    placeholder="Ex: Visita ao Cliente"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start}
                                        onChange={e => setFormData({ ...formData, start: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fim (Opcional)</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end}
                                        onChange={e => setFormData({ ...formData, end: e.target.value })}
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full border border-gray-300 pl-9 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Ex: Showroom"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 p-2.5 rounded-lg h-24 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                    placeholder="Detalhes adicionais..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md hover:shadow-lg transition-all">Salvar Evento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
