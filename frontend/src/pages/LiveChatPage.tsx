import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import {
    Search,
    MoreVertical,
    Paperclip,
    Smile,
    Mic,
    CheckCheck,
    Send,
    Bot,
    PauseCircle,
    PlayCircle
} from 'lucide-react';

interface ChatMessage {
    id: string;
    from: string;
    body: string;
    timestamp: number;
    senderName: string;
    isBot: boolean;
}

interface Contact {
    id: string;
    name: string;
    lastMessage?: string;
    lastTime?: number;
    unread?: number;
    profilePic?: string;
}

export function LiveChatPage() {
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [botPaused, setBotPaused] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusLoaded, setStatusLoaded] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Auto scroll handling
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeContactId]);

    // Fetch contacts
    useEffect(() => {
        fetchContacts();
        fetchPauseStatus();
        const interval = setInterval(fetchContacts, 10000); // Polling for new contacts/updates
        return () => clearInterval(interval);
    }, []);

    const fetchContacts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/whatsapp/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setContacts(data.map((c: any) => ({
                        id: c.id,
                        name: c.name || c.id,
                        lastMessage: c.lastMessage,
                        lastTime: new Date(c.lastTime).getTime() / 1000,
                        unread: 0,
                        profilePic: c.profilePic
                    })));
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchPauseStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/whatsapp/pause-status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setBotPaused((await res.json()).paused);
        } catch (e) { }
    };

    // Load history with fallback polling
    useEffect(() => {
        if (!activeContactId) {
            setMessages([]);
            return;
        }

        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/whatsapp/history?contactId=${activeContactId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const history = await res.json();

                    // Only update if length changed to avoid flicker
                    setMessages(prev => {
                        if (prev.length === history.length) return prev;
                        return history.map((h: any) => ({
                            id: h.id,
                            from: h.from,
                            body: h.body,
                            timestamp: new Date(h.createdAt).getTime() / 1000,
                            senderName: h.senderName,
                            isBot: h.isBot
                        }));
                    });
                }
            } catch (e) { console.error(e); }
        };

        fetchHistory();
        // Fallback polling for UI updates
        const interval = setInterval(fetchHistory, 3000);
        return () => clearInterval(interval);
    }, [activeContactId]);

    // Status & Socket Connection (Global)
    useEffect(() => {
        let socketUrl = API_URL;
        if (socketUrl.startsWith('/')) {
            socketUrl = window.location.origin;
        } else {
            socketUrl = socketUrl.replace('/api', '');
        }

        const newSocket = io(socketUrl, {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });

        // Independent Status Check
        const checkWhatsappStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/whatsapp/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const connected = data.status === 'CONNECTED';
                    setIsConnected(connected);
                    if (!connected) {
                        // If disconnected, clear EVERYTHING to avoid "stale" history view
                        setMessages([]);
                        setContacts([]);
                        setActiveContactId(null);
                    }
                }
            } catch (e) { setIsConnected(false); }
            setStatusLoaded(true);
        };

        // Run immediately
        checkWhatsappStatus();
        const statusInterval = setInterval(checkWhatsappStatus, 5000);

        // Socket Events
        newSocket.on('connect', () => {
            console.log('Socket Connected');
            checkWhatsappStatus();
        });

        newSocket.on('disconnect', () => setIsConnected(false));

        newSocket.on('new_message', (rawMsg: ChatMessage) => {
            const cleanFrom = rawMsg.from.replace(/@c\.us|@g\.us/g, '');
            const msg = { ...rawMsg, from: cleanFrom };

            setContacts(prev => {
                const contactId = msg.isBot && activeContactId ? activeContactId : (msg.from === 'me' ? activeContactId : cleanFrom);
                if (!contactId) return prev;

                const exists = prev.find(c => c.id === contactId);
                const updatedContact = {
                    id: contactId!,
                    name: exists ? exists.name : (msg.senderName || contactId!),
                    lastMessage: msg.body,
                    lastTime: msg.timestamp,
                    unread: (exists?.unread || 0) + (activeContactId === contactId ? 0 : 1)
                };

                const others = prev.filter(c => c.id !== contactId);
                return [updatedContact, ...others];
            });

            // If chat is open, append message
            // Note: We use a functional update here, but we can't easily access the OUTER activeContactId
            // reliably without a ref or dependency. 
            // However, this Effect runs ONCE. 'activeContactId' inside here is STALE (initial value).
            // To fix this, we need to LISTEN to the event but use a Ref for current ID.
        });

        // Join Room
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(user => {
                    newSocket.emit('join_room', { userId: user.id });
                })
                .catch(() => { });
        }

        return () => {
            newSocket.disconnect();
            clearInterval(statusInterval);
        };
    }, []); // Empty dependency array: runs once.

    // To properly handle incoming messages affecting the CURRENT open chat without reconnecting socket:
    const activeContactRef = useRef(activeContactId);
    useEffect(() => { activeContactRef.current = activeContactId; }, [activeContactId]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeContactId) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ to: activeContactId, message: inputText })
            });
            setInputText('');
        } catch (e) {
            alert('Erro ao enviar');
        } finally {
            setSending(false);
        }
    };

    const toggleBot = async () => {
        const newState = !botPaused;
        const token = localStorage.getItem('token');
        try {
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
            console.error(e);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            return formatTime(timestamp);
        }
        return date.toLocaleDateString('pt-BR');
    };

    const activeContact = contacts.find(c => c.id === activeContactId);
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#e9edef] -m-4 md:-m-8 relative">
            {statusLoaded && !isConnected && (
                <div className="absolute inset-0 z-50 bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🚫</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">WhatsApp Desconectado</h2>
                        <p className="text-gray-500 mb-6">
                            A conexão com o WhatsApp foi perdida. Conecte-se novamente para acessar o histórico e as conversas.
                        </p>
                        <Link
                            to="/dashboard/whatsapp"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Ir para Conexão
                        </Link>
                    </div>
                </div>
            )}

            {/* Sidebar (Left Pane) */}
            <div className="w-[400px] flex flex-col bg-white border-r border-[#d1d7db]">
                {/* User Header */}
                <div className="h-[60px] px-4 py-2 bg-[#f0f2f5] flex items-center justify-between border-b border-[#d1d7db]">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden cursor-pointer">
                        <img src="https://i.pravatar.cc/150?u=me" className="w-full h-full object-cover" alt="Me" />
                    </div>
                    <div className="flex gap-6 text-[#54656f]">
                        <div title={isConnected ? 'Conectado' : 'Desconectado'} className={`w-3 h-3 rounded-full mt-1.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <MoreVertical className="w-6 h-6 cursor-pointer" />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-3 py-2 bg-white border-b border-[#f0f2f5]">
                    <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-2 h-9">
                        <Search className="w-5 h-5 text-[#54656f] mr-4 md:mr-6" />
                        <input
                            type="text"
                            placeholder="Pesquisar ou começar uma nova conversa"
                            className="bg-transparent text-sm w-full focus:outline-none text-[#3b4a54] placeholder:text-[#54656f]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar-minimal">
                    {filteredContacts.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 text-sm">Nenhuma conversa encontrada</div>
                    ) : (
                        filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setActiveContactId(contact.id)}
                                className={`h-[72px] flex px-3 pr-4 cursor-pointer hover:bg-[#f5f6f6] transition-colors relative group
                                    ${activeContactId === contact.id ? 'bg-[#f0f2f5]' : ''}`}
                            >
                                <div className="flex items-center">
                                    <div className="w-[49px] h-[49px] rounded-full bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
                                        <img src={`https://ui-avatars.com/api/?name=${contact.name}&background=random`} className="w-full h-full object-cover" alt={contact.name} />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center border-b border-[#f0f2f5] min-w-0 py-3 group-last:border-none">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="text-[#111b21] text-[17px] leading-none truncate">{contact.name}</h3>
                                        <span className={`text-[12px] leading-none ${contact.unread ? 'text-[#00a884] font-medium' : 'text-[#667781]'}`}>
                                            {formatDate(contact.lastTime || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[#667781] text-[14px] truncate leading-5 flex-1 pr-2">
                                            {contact.lastMessage || ''}
                                        </p>
                                        {contact.unread && contact.unread > 0 && (
                                            <div className="w-5 h-5 bg-[#00a884] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                                                {contact.unread}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="text-xs text-center text-gray-400 py-2 border-t flex items-center justify-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Criptografado de ponta a ponta
                </div>
            </div>

            {/* Main Chat Area (Right Pane) */}
            <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                {!activeContactId ? (
                    <div className="flex flex-col items-center justify-center h-full border-b-[6px] border-[#25D366]">
                        <div className="w-[300px] text-center">
                            <h1 className="text-3xl font-light text-[#41525d] mb-4">ZapCar Web</h1>
                            <p className="text-[#667781] text-sm leading-6">
                                Envie e receba mensagens sem precisar manter seu celular conectado.<br />
                                Use o ZapCar em até 4 aparelhos e 1 celular ao mesmo tempo.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-[60px] px-4 py-2 bg-[#f0f2f5] flex items-center justify-between border-b border-[#d1d7db] z-20 shadow-sm">
                            <div className="flex items-center gap-4 cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    <img src={`https://ui-avatars.com/api/?name=${activeContact?.name}&background=random`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h2 className="text-[#111b21] text-[16px] leading-tight font-medium">{activeContact?.name}</h2>
                                    <p className="text-[13px] text-[#667781] leading-tight">
                                        {activeContact?.id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-[#54656f]">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleBot}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                                            ${botPaused ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}
                                        `}
                                    >
                                        {botPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                                        {botPaused ? 'Ativar Robô' : 'Pausar Robô'}
                                    </button>
                                </div>
                                <Search className="w-6 h-6 cursor-pointer" />
                                <MoreVertical className="w-6 h-6 cursor-pointer" />
                            </div>
                        </div>

                        {/* Chat Background & Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-[5%] pt-4 pb-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"
                            style={{ backgroundColor: '#efeae2' }}
                            ref={messagesContainerRef}
                        >
                            <div className="flex flex-col space-y-2">
                                {messages.map((msg, idx) => {
                                    // Logic to determine if "me" (outgoing) or contact (incoming)
                                    // The backend logic says: if isBot=true OR from='me' OR from='bot' -> Outgoing
                                    // Else -> Incoming
                                    const isOutgoing = msg.isBot || msg.from === 'me' || msg.from === 'bot';

                                    // Grouping logic (optional for visual polish, stick to basic first)
                                    return (
                                        <div
                                            key={msg.id + idx}
                                            className={`flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`relative max-w-[65%] px-2 py-1.5 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] text-sm
                                                    ${isOutgoing ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
                                                `}
                                            >
                                                {/* Bot Indicator */}
                                                {msg.isBot && msg.senderName.includes('(Bot)') && (
                                                    <span className="text-[10px] text-[#00a884] font-bold block mb-1 flex items-center gap-1">
                                                        <Bot size={10} /> Resposta Automática
                                                    </span>
                                                )}

                                                <div className="text-[#111b21] leading-[19px] whitespace-pre-wrap break-words pb-4 min-w-[80px]">
                                                    {msg.body}
                                                </div>

                                                <div className="absolute right-2 bottom-1 flex items-center space-x-1 select-none">
                                                    <span className="text-[11px] text-[#667781] min-w-[40px] text-right">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                    {isOutgoing && (
                                                        <span className="text-[#53bdeb]">
                                                            <CheckCheck className="w-4 h-4" />
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Corner Triangle Decoration */}
                                                <div className={`absolute top-0 w-3 h-3 ${isOutgoing ? '-right-[8px] color-[#d9fdd3]' : '-left-[8px] color-white'}`}>
                                                    <svg viewBox="0 0 8 13" height="13" width="8" className="block fill-current" style={{ color: isOutgoing ? '#d9fdd3' : '#fff' }}>
                                                        <path opacity=".13" d={isOutgoing ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"}></path>
                                                        <path d={isOutgoing ? "M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" : "M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"}></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="h-[62px] px-4 py-2 bg-[#f0f2f5] flex items-center gap-4 border-t border-[#d1d7db] z-20">
                            <div className="text-[#54656f] cursor-pointer hover:text-gray-600">
                                <Smile className="w-7 h-7" />
                            </div>
                            <div className="text-[#54656f] cursor-pointer hover:text-gray-600">
                                <Paperclip className="w-6 h-6" />
                            </div>

                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Mensagem"
                                    className="w-full h-10 px-4 py-2 rounded-lg bg-white border border-white focus:outline-none focus:border-white text-[#3b4a54] text-[15px] placeholder:text-[#54656f]"
                                />
                            </div>

                            <div className="text-[#54656f] cursor-pointer hover:text-gray-600">
                                {inputText.trim() ? (
                                    <button onClick={handleSendMessage} disabled={sending}>
                                        <Send className="w-6 h-6 text-[#54656f]" />
                                    </button>
                                ) : (
                                    <Mic className="w-6 h-6" />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
