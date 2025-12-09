
import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { MessageSquare, Send, Bot, User, PauseCircle, PlayCircle } from 'lucide-react';

interface ChatMessage {
    id: string;
    from: string;
    body: string;
    timestamp: number;
    senderName: string;
    isBot: boolean;
}

export function LiveChatPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [botPaused, setBotPaused] = useState(false); // Mock state for now

    // Auto-scroll to bottom
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect to Socket.IO
        // Note: API_URL usually has /api appended, we need the base for socket
        // If API_URL is https://zapicar.com.br/api, socket should be https://zapicar.com.br
        const socketUrl = API_URL.replace('/api', '');

        const newSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);

            // Join Room (User ID) - We need to send an event to join
            const token = localStorage.getItem('token');
            if (token) {
                // Decode token to get UserId roughly or just rely on backend to know who we are?
                // Actually the gateway expects 'join_room' event with userId.
                // We need to fetch our profile to get our ID first?
                // Let's use the profile fetch strategy or decode JWT if possible. 
                // For now, let's fetch profile first then join.
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('new_message', (msg: ChatMessage) => {
            console.log('New message received:', msg);
            setMessages(prev => [...prev, msg]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Fetch Profile to get User ID for Room Join
    useEffect(() => {
        const joinRoom = async () => {
            const token = localStorage.getItem('token');
            if (!token || !socket) return;

            try {
                const response = await fetch(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const user = await response.json();
                    socket.emit('join_room', { userId: user.id });
                }
            } catch (e) {
                console.error('Failed to join room', e);
            }
        };

        if (isConnected && socket) {
            joinRoom();
        }
    }, [isConnected, socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch Initial Bot Status
    useEffect(() => {
        const fetchPauseStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await fetch(`${API_URL}/whatsapp/pause-status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setBotPaused(data.paused);
                }
            } catch (e) {
                console.error('Failed to fetch bot status', e);
            }
        };
        fetchPauseStatus();
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-blue-600" />
                        Chat em Tempo Real
                    </h1>
                    <p className="text-gray-600">Acompanhe os atendimentos da IA ao vivo.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                    <button
                        onClick={async () => {
                            const newState = !botPaused;
                            try {
                                const token = localStorage.getItem('token');
                                await fetch(`${API_URL}/whatsapp/pause`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ paused: newState })
                                });
                                setBotPaused(newState);
                            } catch (e) {
                                console.error('Failed to toggle bot', e);
                            }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${botPaused ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {botPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                        {botPaused ? 'Retomar Bot' : 'Pausar Bot'}
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                            <p>Aguardando novas mensagens...</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.isBot ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.isBot
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                                        {msg.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                        <span className="font-medium">{msg.senderName}</span>
                                        <span>•</span>
                                        <span>{new Date(msg.timestamp * 1000).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {msg.body}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area (Manual Takeover - Placeholder for now) */}
                <div className="p-4 border-t bg-white">
                    <div className="flex items-center gap-2 relative">
                        <input
                            type="text"
                            placeholder="Intervir na conversa (Em breve)..."
                            disabled
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-not-allowed"
                        />
                        <button disabled className="absolute right-2 p-2 text-gray-400">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        * O recurso de parar o bot e enviar mensagens manualmente será ativado na próxima atualização.
                    </p>
                </div>
            </div>
        </div>
    );
}
