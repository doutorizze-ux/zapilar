
import { useEffect, useState, useRef } from 'react';
import { X, Send, Clock } from 'lucide-react';
import { API_URL } from '../config';

interface Message {
    id: string;
    from: string;
    body: string;
    senderName: string;
    isBot: boolean;
    createdAt: string;
}

interface ChatHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: {
        id: string;
        phone: string;
        name?: string;
    } | null;
    token: string | null;
}

export function ChatHistoryModal({ isOpen, onClose, lead, token }: ChatHistoryModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && lead && token) {
            fetchHistory();
        }
    }, [isOpen, lead, token]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchHistory = async () => {
        if (!lead) return;
        setLoading(true);
        try {
            // contactId in backend expects the phone number (or JID)
            const response = await fetch(`${API_URL}/whatsapp/history?contactId=${lead.phone}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !lead || !token) return;

        try {
            const response = await fetch(`${API_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: lead.phone,
                    message: newMessage
                })
            });

            if (response.ok) {
                setNewMessage('');
                fetchHistory(); // Refresh to see the new message
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                            {(lead.name || lead.phone).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{lead.name || lead.phone}</h3>
                            <p className="text-xs text-cyan-600 font-medium tracking-tight">Histórico de Conversa</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f0f2f5] scroll-smooth"
                >
                    {loading && messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                            Carregando histórico...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Clock className="w-8 h-8 opacity-20" />
                            <p className="text-sm">Nenhuma mensagem encontrada.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.from === 'me' || msg.isBot;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm relative ${isMe
                                        ? 'bg-cyan-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}>
                                        <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                            {isMe ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {msg.isBot ? '🤖 Bot' : '👤 Você'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    📱 Cliente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                        <div className={`text-[9px] mt-1.5 text-right opacity-60 font-medium`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite uma mensagem para enviar via WhatsApp..."
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-cyan-600 text-white p-2.5 rounded-xl hover:bg-cyan-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                        As mensagens enviadas aqui serão entregues diretamente no WhatsApp do cliente.
                    </p>
                </div>
            </div>
        </div>
    );
}
