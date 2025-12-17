import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCircle, TrendingUp, Smartphone, Shield, ArrowRight, Play, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SupportChatWidget } from '../components/SupportChatWidget';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B2B26] font-sans text-white overflow-x-hidden selection:bg-green-500 selection:text-white">

            {/* Navbar */}
            {/* Navbar */}
            <nav className="fixed w-full bg-gradient-to-r from-[#051815] to-[#0B2B26] z-50 border-b border-white/5 h-20 flex items-center shadow-lg backdrop-blur-md bg-opacity-90">
                <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
                    {/* Logo - Force original colors (no filters) to show the green dot */}
                    <img src="/logo-z-green.png" alt="Zapicar" className="h-12 w-auto object-contain" />

                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors border border-transparent hover:border-white/10 px-4 py-2 rounded-full">
                            Entrar
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="hidden md:flex bg-white text-[#0B2B26] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
                        >
                            Experimente grátis
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-10 lg:pt-48 lg:pb-20 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-green-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-green-300 text-sm font-bold animate-fade-in-up backdrop-blur-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Novo: Integração Total com seu Estoque
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                            Venda carros no <span className="text-[#25D366]">WhatsApp</span> automaticamente
                        </h1>

                        <p className="text-xl text-gray-400 leading-relaxed font-light">
                            Atendimento 24h que envia fotos, preços e detalhes do carro exato que o cliente procura, direto do seu estoque.
                        </p>

                        <div className="space-y-3 py-2">
                            {[
                                "Cada lojista usa seu próprio WhatsApp",
                                "Sem disparos em massa, sem spam",
                                "Funciona como o WhatsApp Web, 100% seguro"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-5 h-5 text-[#25D366]" />
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-[#25D366] text-white rounded-full font-bold text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 transform hover:scale-105"
                            >
                                <MessageCircle className="w-6 h-6" />
                                Testar grátis por 7 dias
                            </button>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 pt-4">
                            <span className="text-gray-500">Sem cartão de crédito • Instalação em 2 minutos</span>
                        </div>
                    </div>

                    {/* WhatsApp Mockup Animation */}
                    <div className="relative mx-auto lg:mr-0 z-10 perspective-1000">
                        {/* Floating Container */}
                        <motion.div
                            initial={{ opacity: 0, rotateY: -15, y: 50 }}
                            animate={{ opacity: 1, rotateY: -5, y: 0 }}
                            transition={{ duration: 1 }}
                            className="relative w-[300px] sm:w-[320px] mx-auto"
                        >
                            {/* Floating Stats Badge Left */}
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                                className="absolute -left-20 top-20 bg-gray-900/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl z-50 flex items-center gap-3 w-48 hover:scale-105 transition-transform"
                                style={{ transformStyle: 'preserve-3d', transform: 'translateZ(50px)' }}
                            >
                                <div className="bg-green-500/20 p-2 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Vendas Hoje</p>
                                    <p className="text-white font-bold text-lg">R$ 145.000</p>
                                </div>
                            </motion.div>

                            {/* Floating Stats Badge Right */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, delay: 0 }}
                                className="absolute -right-16 bottom-32 bg-gray-900/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-2xl z-50 flex items-center gap-3 hover:scale-105 transition-transform"
                                style={{ transformStyle: 'preserve-3d', transform: 'translateZ(50px)' }}
                            >
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <MessageCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Novos Leads</p>
                                    <p className="text-white font-bold text-lg">+12</p>
                                </div>
                            </motion.div>

                            {/* Realistic iPhone Case */}
                            <div className="relative rounded-[3rem] bg-[#1a1a1a] shadow-[0_0_0_10px_#1a1a1a,0_0_0_12px_#333,0_0_50px_rgba(0,0,0,0.5)] overflow-hidden h-[650px] transform transition-transform duration-500 hover:scale-[1.02]">
                                {/* Glass Reflection Overlay */}
                                <div className="absolute inset-0 z-50 pointer-events-none rounded-[3rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] bg-gradient-to-tr from-white/5 via-transparent to-transparent"></div>

                                {/* Side Buttons */}
                                <div className="absolute top-24 -left-3.5 w-1 h-7 bg-[#2a2a2a] rounded-l-md border-l border-gray-600"></div>
                                <div className="absolute top-36 -left-3.5 w-1 h-12 bg-[#2a2a2a] rounded-l-md border-l border-gray-600"></div>
                                <div className="absolute top-52 -left-3.5 w-1 h-12 bg-[#2a2a2a] rounded-l-md border-l border-gray-600"></div>
                                <div className="absolute top-40 -right-3.5 w-1 h-16 bg-[#2a2a2a] rounded-r-md border-r border-gray-600"></div>

                                {/* Dynamic Island / Notch */}
                                <div className="absolute top-4 inset-x-0 h-7 w-28 mx-auto bg-black rounded-full z-50 flex items-center justify-center gap-2 px-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a] ring-1 ring-gray-800"></div>
                                </div>

                                {/* Screen Content */}
                                <div className="w-full h-full bg-[#E5DDD5] flex flex-col relative overflow-hidden rounded-[2.5rem]">
                                    {/* Mobile Status Bar */}
                                    <div className="h-12 w-full flex justify-between items-center px-6 pt-3 text-black z-40 bg-[#075E54]/5 backdrop-blur-sm">
                                        <span className="text-xs font-bold">10:42</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-4 h-3 bg-black rounded-sm border border-black opacity-40"></div>
                                            <div className="w-3 h-3 bg-black rounded-full opacity-40"></div>
                                        </div>
                                    </div>

                                    {/* Chat Header (WhatsApp iOS Style) */}
                                    <div className="h-20 bg-[#f4f4f4]/80 backdrop-blur-xl border-b border-gray-200 p-4 pt-2 flex items-center gap-3 z-30 shadow-sm relative">
                                        <div className="flex items-center gap-1 text-blue-500 -ml-1">
                                            <ArrowRight className="w-5 h-5 rotate-180" />
                                            <span className="text-sm">Voltar</span>
                                        </div>
                                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 border border-gray-300">
                                            <div className="w-full h-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">Z</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-black text-sm truncate">Zapicar</p>
                                            <p className="text-[10px] text-gray-500">Conta comercial</p>
                                        </div>
                                    </div>

                                    {/* Wallpaper Pattern */}
                                    <div className="absolute inset-0 opacity-40 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]"></div>

                                    {/* Messages Area */}
                                    <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20 relative z-10 font-sans">

                                        {/* Date Divider */}
                                        <div className="flex justify-center my-4">
                                            <span className="bg-[#e1f3fb] text-gray-600 text-[10px] px-2 py-1 rounded-lg shadow-sm border border-black/5 uppercase font-medium">Hoje</span>
                                        </div>

                                        {/* Message 1: User */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 1.2 }}
                                            className="self-end bg-[#DCF8C6] ml-auto p-2.5 px-3 rounded-lg rounded-tr-none shadow-sm max-w-[85%] relative border border-[#c4eab0]"
                                        >
                                            <p className="text-sm text-gray-800 leading-snug">Olá! Vi a Hilux no site. Ainda está disponível?</p>
                                            <span className="text-[10px] text-gray-500 block text-right mt-1 flex items-center justify-end gap-1">
                                                10:42 <span className="text-blue-500">✓✓</span>
                                            </span>
                                        </motion.div>

                                        {/* Message 2: Bot */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 2.5 }}
                                            className="self-start bg-white mr-auto p-2.5 px-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] relative border border-gray-100"
                                        >
                                            <p className="text-sm text-gray-800 leading-snug">Olá! 👋 Sou o assistente virtual da Loja. <br /> Sim! A <b>Toyota Hilux SRX 2024</b> está disponível no pátio.</p>

                                            <div className="mt-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                                <div className="relative h-32 rounded bg-gray-200 overflow-hidden">
                                                    <img src="/hilux-mockup.jpg" className="w-full h-full object-cover" alt="Carro" />
                                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">4 fotos</div>
                                                </div>
                                                <div className="p-2">
                                                    <p className="font-bold text-xs text-gray-800">Toyota Hilux SRX</p>
                                                    <p className="text-[10px] text-gray-500">2024 • Diesel • 4x4</p>
                                                    <p className="text-sm font-bold text-green-600 mt-1">R$ 289.900</p>
                                                </div>
                                            </div>

                                            <span className="text-[10px] text-gray-500 block text-right mt-1">10:42</span>
                                        </motion.div>

                                        {/* Typing Indicator */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 1, 0, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 4 }}
                                            className="bg-white w-12 h-8 rounded-full rounded-tl-none shadow-sm p-2 flex items-center justify-center gap-1 ml-0"
                                        >
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        </motion.div>

                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Differential Section */}
            <section className="py-24 bg-[#051815] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Por que o Zapicar funciona e outros não?</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Jeito Antigo */}
                        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl">
                            <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                                <XCircle className="w-6 h-6" /> Jeito Antigo
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-gray-400">
                                    <XCircle className="w-5 h-5 text-red-500/50 flex-shrink-0" /> Cliente espera resposta
                                </li>
                                <li className="flex items-center gap-3 text-gray-400">
                                    <XCircle className="w-5 h-5 text-red-500/50 flex-shrink-0" /> Mensagens acumulam
                                </li>
                                <li className="flex items-center gap-3 text-gray-400">
                                    <XCircle className="w-5 h-5 text-red-500/50 flex-shrink-0" /> Leads esfriam
                                </li>
                                <li className="flex items-center gap-3 text-gray-400">
                                    <XCircle className="w-5 h-5 text-red-500/50 flex-shrink-0" /> Vendas se perdem
                                </li>
                            </ul>
                        </div>

                        {/* Com Zapicar */}
                        <div className="bg-[#25D366]/5 border border-[#25D366]/20 p-8 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                            <h3 className="text-xl font-bold text-[#25D366] mb-6 flex items-center gap-2">
                                <CheckCircle className="w-6 h-6" /> Com Zapicar
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white">
                                    <CheckCircle className="w-5 h-5 text-[#25D366] flex-shrink-0" /> Cliente pede o carro
                                </li>
                                <li className="flex items-center gap-3 text-white">
                                    <CheckCircle className="w-5 h-5 text-[#25D366] flex-shrink-0" /> O bot envia apenas esse carro
                                </li>
                                <li className="flex items-center gap-3 text-white">
                                    <CheckCircle className="w-5 h-5 text-[#25D366] flex-shrink-0" /> Fotos + preço + detalhes na hora
                                </li>
                                <li className="flex items-center gap-3 text-white">
                                    <CheckCircle className="w-5 h-5 text-[#25D366] flex-shrink-0" /> Lead quente direto para o lojista
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>


            {/* WhatsApp Demo Section */}
            <section className="py-24 bg-[#08221E] border-y border-white/5">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center justify-center gap-3">
                        <Play className="w-8 h-8 text-[#25D366] fill-current" />
                        Veja como o cliente compra sozinho pelo WhatsApp
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                        O bot entende o que o cliente quer e responde automaticamente usando o seu estoque real, mesmo fora do horário comercial.
                    </p>

                    <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/OlQsPKINofc"
                            title="Desmonstração Zapicar"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Website Bonus Section */}
            <section className="py-24 bg-gradient-to-br from-[#0B2B26] to-black relative border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="order-2 lg:order-1 relative">
                        {/* Browser Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900"
                        >
                            <div className="bg-gray-800 p-3 flex gap-2 border-b border-gray-700">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <div className="ml-4 w-full bg-gray-900 rounded-md h-5 opacity-50 text-[10px] flex items-center px-2 text-gray-400 font-mono">
                                    zapicar.com.br/sua-loja
                                </div>
                            </div>
                            <div className="relative aspect-video bg-gray-900 group cursor-pointer overflow-hidden">
                                {/* Simulated Website Content */}
                                <div className="absolute inset-0 bg-gray-100 flex flex-col">
                                    <div className="h-1/2 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center p-6 relative">
                                        <div className="text-center">
                                            <div className="h-4 w-32 bg-white/20 rounded mx-auto mb-2"></div>
                                            <div className="h-8 w-64 bg-white/10 rounded mx-auto"></div>
                                        </div>
                                    </div>
                                    <div className="h-1/2 p-6 grid grid-cols-3 gap-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="bg-white rounded-lg shadow-sm p-2 flex flex-col gap-2">
                                                <div className="w-full h-12 bg-gray-200 rounded"></div>
                                                <div className="w-full h-2 bg-gray-200 rounded"></div>
                                                <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="text-white font-bold border border-white px-4 py-2 rounded-full uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors">
                                        Ver Exemplo
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-bold uppercase tracking-wider">
                            BÔNUS EXCLUSIVO
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Bônus exclusivo: <span className="text-[#25D366]">site profissional</span> para sua loja
                        </h2>

                        <ul className="space-y-4 pt-4">
                            {[
                                "Domínio personalizado (zapicar.com.br/sua-loja)",
                                "Sincronização automática com seu estoque",
                                "Design premium que transmite confiança",
                                "Botão de WhatsApp em cada veículo"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <div className="w-6 h-6 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-4 h-4 text-[#25D366]" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => navigate('/register')}
                            className="mt-6 px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            Quero meu site agora
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Cards */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Smartphone,
                                title: "Atendimento automático 24h",
                                desc: "Responda clientes instantaneamente, todos os dias"
                            },
                            {
                                icon: TrendingUp,
                                title: "Gestão de estoque",
                                desc: "Seus carros sempre sincronizados"
                            },
                            {
                                icon: MessageCircle,
                                title: "Captação de leads",
                                desc: "Todo contato vira oportunidade"
                            },
                            {
                                icon: Shield,
                                title: "Segurança de dados",
                                desc: "Tecnologia criptografada"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:border-[#25D366]/50 transition-all hover:-translate-y-2 group">
                                <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#25D366]/20 transition-colors">
                                    <feature.icon className="w-7 h-7 text-[#25D366]" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed font-light">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Target Audience */}
            <section className="py-24 bg-[#092520] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Para quem é o Zapicar?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            "Lojas de veículos",
                            "Garagistas",
                            "Concessionárias",
                            "Quem anuncia em marketplaces",
                            "Quem perde vendas no WhatsApp"
                        ].map((item, i) => (
                            <div key={i} className="bg-[#0B2B26] p-6 rounded-xl border border-white/5 text-center hover:border-[#25D366]/30 transition-colors group">
                                <CheckCircle className="w-8 h-8 text-[#25D366] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                                <p className="text-white font-medium">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-[#0B2B26] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#25D366] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Pronto para vender carros no piloto automático?</h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Teste o Zapicar gratuitamente por 7 dias e veja seu WhatsApp trabalhando por você.
                    </p>

                    <button
                        onClick={() => navigate('/register')}
                        className="px-10 py-5 bg-[#25D366] text-white rounded-full font-bold text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-500/20 transform hover:scale-105"
                    >
                        Começar teste grátis
                    </button>

                    <p className="mt-6 text-sm text-gray-500">
                        Não realizamos disparos em massa. O Zapicar responde apenas clientes reais.
                    </p>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-24 bg-[#051815] relative">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Fale Conosco</h2>
                        <p className="text-gray-400">Tem alguma dúvida ou precisa de ajuda? Envie uma mensagem.</p>
                    </div>

                    <form
                        className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 space-y-6"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            const data = Object.fromEntries(formData.entries());

                            try {
                                const response = await fetch(`${import.meta.env.VITE_API_URL}/support`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(data)
                                });

                                if (response.ok) {
                                    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                                    form.reset();
                                } else {
                                    alert('Erro ao enviar mensagem.');
                                }
                            } catch (error) {
                                alert('Erro de conexão.');
                            }
                        }}
                    >
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                                <input required name="name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors" placeholder="Seu nome" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp</label>
                                <input required name="whatsapp" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors" placeholder="(00) 00000-0000" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input required type="email" name="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors" placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Assunto</label>
                                <select name="subject" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors appearance-none cursor-pointer">
                                    <option value="Dúvida Comercial" className="bg-[#0B2B26]">Dúvida Comercial</option>
                                    <option value="Suporte Técnico" className="bg-[#0B2B26]">Suporte Técnico</option>
                                    <option value="Financeiro" className="bg-[#0B2B26]">Financeiro</option>
                                    <option value="Esqueci minha senha" className="bg-[#0B2B26]">Esqueci minha senha</option>
                                    <option value="Outros" className="bg-[#0B2B26]">Outros</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
                            <textarea required name="message" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#25D366] transition-colors resize-none" placeholder="Como podemos ajudar?"></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" className="bg-[#25D366] text-white px-8 py-3 rounded-xl font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-500/20">
                                Enviar Mensagem
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#051815] border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <img src="/logo-dark.png" alt="Zapicar" className="h-8 w-auto brightness-0 invert opacity-50 hover:opacity-100 transition-all" />
                    <p className="text-gray-600 text-sm font-medium">© 2025 Zapicar Tecnologia.</p>
                </div>
            </footer>


            <SupportChatWidget />
        </div>
    );
}
