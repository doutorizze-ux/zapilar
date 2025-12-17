import { useState, useRef, useEffect } from 'react';
import { X, Send, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Knowledge Base
const FAQ = [
    {
        id: 'login',
        title: '🔐 Login & Senha',
        keywords: ['senha', 'login', 'entrar', 'acesso', 'esqueci', 'recuperar'],
        answer: 'Para redefinir sua senha, clique em "Esqueci minha senha" na tela de login. Um link será enviado ao seu e-mail cadastrado. Se não receber, verifique a caixa de spam.'
    },
    {
        id: 'estoque',
        title: '🚗 Estoque & Veículos',
        keywords: ['estoque', 'veiculo', 'carro', 'anuncio', 'foto', 'preco'],
        answer: 'Acesse o menu "Veículos" no painel. Lá você pode adicionar novos carros, editar preços e fazer upload de fotos. Lembre-se de preencher todos os dados obrigatórios.'
    },
    {
        id: 'bot',
        title: '🤖 WhatsApp Bot',
        keywords: ['bot', 'whatsapp', 'conectar', 'qr', 'automacao', 'responder'],
        answer: 'Para ativar o bot, vá em "WhatsApp" no menu lateral e leia o QR Code. O bot responderá automaticamente sobre os carros do seu estoque quando o cliente perguntar.'
    },
    {
        id: 'planos',
        title: '💳 Planos & Pagamentos',
        keywords: ['plano', 'pagamento', 'fatura', 'cartao', 'pix', 'assinatura'],
        answer: 'Você pode gerenciar sua assinatura no menu "Planos". Aceitamos PIX e Cartão de Crédito. Se precisar de nota fiscal ou tiver problemas com cobrança, use o formulário de contato.'
    },
    {
        id: 'config',
        title: '⚙️ Configurações',
        keywords: ['configuracao', 'loja', 'nome', 'logo', 'endereco'],
        answer: 'No menu "Configurações" você pode alterar o nome da loja, telefone principal e logo. Essas informações aparecem no seu site e nas mensagens do bot.'
    }
];

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    options?: { label: string; action: () => void }[];
}

export function SupportChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initial Greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    text: 'Olá! Sou o Assistente Virtual do Zapicar. Como posso te ajudar hoje?',
                    sender: 'bot',
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen]);

    const addMessage = (text: string, sender: 'user' | 'bot') => {
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            sender,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };

    const handleOptionClick = (faqItem: typeof FAQ[0]) => {
        addMessage(faqItem.title, 'user');
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            addMessage(faqItem.answer, 'bot');

            // Allow follow up
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Math.random().toString(),
                    text: 'Posso ajudar em algo mais?',
                    sender: 'bot',
                    timestamp: new Date()
                }]);
            }, 800);
        }, 500);
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userText = input.trim();
        addMessage(userText, 'user');
        setInput('');
        setIsTyping(true);

        // Simple Keyword Matching
        setTimeout(() => {
            const lowerText = userText.toLowerCase();
            const match = FAQ.find(item => item.keywords.some(k => lowerText.includes(k)));

            setIsTyping(false);

            if (match) {
                addMessage(match.answer, 'bot');
            } else {
                addMessage('Não encontrei essa informação no meu banco de dados. Por favor, tente escolher uma das opções abaixo ou use o formulário de contato para falar com um humano.', 'bot');
            }
        }, 800);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-[350px] md:w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-[#0B2B26] p-4 flex items-center justify-between border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center relative">
                                    <img src="/logo-dark.png" className="w-6 h-6 object-contain invert brightness-0 opacity-80" alt="Bot" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0B2B26] rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Suporte Zapicar</h3>
                                    <p className="text-xs text-green-400 font-medium">Online Agora</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto min-h-[300px] max-h-[400px] space-y-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                            ? 'bg-[#0B2B26] text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Options / Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            {/* Quick Options Area */}
                            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
                                {FAQ.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleOptionClick(item)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-full transition-colors border border-gray-200"
                                    >
                                        {item.title}
                                    </button>
                                ))}
                            </div>

                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2 items-center"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Digite sua dúvida..."
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0B2B26] transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-2.5 bg-[#0B2B26] text-white rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 bg-[#0B2B26] rounded-full shadow-[0_4px_20px_rgba(11,43,38,0.4)] flex items-center justify-center text-white border-2 border-[#25D366] relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                {isOpen ? <X size={24} /> : <HelpCircle size={28} />}

                {!isOpen && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </motion.button>
        </div>
    );
}
