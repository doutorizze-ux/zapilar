import { useNavigate } from 'react-router-dom';
import { MessageCircle, CheckCircle, TrendingUp, Smartphone, Shield, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B2B26] font-sans text-white overflow-x-hidden selection:bg-green-500 selection:text-white">

            {/* Navbar */}
            <nav className="fixed w-full bg-[#0B2B26]/80 backdrop-blur-md z-50 border-b border-white/5 h-20 flex items-center">
                <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
                    <img src="/logo-dark.png" alt="Zapicar" className="h-10 w-auto brightness-0 invert" />
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                            Entrar
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="hidden md:flex bg-[#25D366] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-green-500 transition-all hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transform hover:-translate-y-0.5"
                        >
                            Comece Agora
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
                            Aumente suas vendas e fidelize clientes no <span className="text-[#25D366]">WhatsApp</span>
                        </h1>

                        <p className="text-xl text-gray-400 leading-relaxed font-light">
                            O Zapicar transforma o WhatsApp em um grande aliado para o crescimento da sua loja de veículos. Atendimento 24h com IA.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-[#25D366] text-white rounded-full font-bold text-lg hover:bg-green-500 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 transform hover:scale-105"
                            >
                                <MessageCircle className="w-6 h-6" />
                                Experimente Agora
                            </button>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 pt-4">
                            <div className="flex items-center gap-2 text-gray-400">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Sem cartão de crédito
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Instalação em 2 min
                            </div>
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
                                            <p className="font-bold text-black text-sm truncate">ZapCar</p>
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

            {/* Video Tutorial Section - Requested */}
            <section className="py-10 bg-[#08221E] border-y border-white/5">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-8 flex items-center justify-center gap-3">
                        <Play className="w-6 h-6 text-[#25D366] fill-current" />
                        Veja como funciona na prática
                    </h2>

                    <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/Fakxk98cNnk?rel=0"
                            title="Vídeo Tutorial"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Features Cards */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Smartphone,
                                title: "Atendimento Automático",
                                desc: "Responda clientes instantaneamente 24/7 sem intervenção humana."
                            },
                            {
                                icon: TrendingUp,
                                title: "Gestão de Estoque",
                                desc: "Seus carros sincronizados. O robô sabe o que vender e por quanto."
                            },
                            {
                                icon: Shield,
                                title: "Segurança de Dados",
                                desc: "Tecnologia criptografada para proteger seus leads e conversas."
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

            {/* Inventory Preview Section */}
            <section className="py-24 bg-[#092520] overflow-hidden border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between mb-16 gap-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-bold text-white mb-4">Gerencie seu estoque como um gigante</h2>
                        <p className="text-gray-400 text-lg font-light">
                            Uma interface limpa e intuitiva para você cadastrar carros, preços e fotos.
                            Tudo sincronizado em tempo real.
                        </p>
                    </div>
                    <button onClick={() => navigate('/register')} className="text-[#25D366] font-bold hover:text-white flex items-center gap-2 group transition-colors">
                        Ver Recursos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Horizontal Scroll Cards (Duplicated for seamless loop) */}
                <div className="relative w-full overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#092520] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#092520] to-transparent z-10 pointer-events-none"></div>

                    <div className="flex gap-6 animate-scroll-slow w-[200%]">
                        {/* Original Items + Duplicated Items for Loop */}
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-6 flex-shrink-0">
                                <div className="min-w-[300px] bg-[#0B2B26] border border-white/10 rounded-2xl overflow-hidden shadow-lg group hover:border-[#25D366]/50 transition-colors">
                                    <div className="h-48 bg-gray-800 relative">
                                        <img src="/car-hilux.jpg" alt="Car" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs">R$ 289.900</div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-white">Toyota Hilux SRX</h4>
                                        <p className="text-xs text-gray-500 mt-1">Automático • Diesel</p>
                                    </div>
                                </div>
                                <div className="min-w-[300px] bg-[#0B2B26] border border-white/10 rounded-2xl overflow-hidden shadow-lg group hover:border-[#25D366]/50 transition-colors">
                                    <div className="h-48 bg-gray-800 relative">
                                        <img src="/car-suv.png" alt="Car" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs">R$ 150.000</div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-white">Jeep Compass</h4>
                                        <p className="text-xs text-gray-500 mt-1">Automático • Flex</p>
                                    </div>
                                </div>
                                <div className="min-w-[300px] bg-[#0B2B26] border border-white/10 rounded-2xl overflow-hidden shadow-lg group hover:border-[#25D366]/50 transition-colors">
                                    <div className="h-48 bg-gray-800 relative">
                                        <img src="/car-sedan.png" alt="Car" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs">R$ 90.000</div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-white">Honda Civic</h4>
                                        <p className="text-xs text-gray-500 mt-1">Automático • Flex</p>
                                    </div>
                                </div>
                                <div className="min-w-[300px] bg-[#0B2B26] border border-white/10 rounded-2xl overflow-hidden shadow-lg group hover:border-[#25D366]/50 transition-colors">
                                    <div className="h-48 bg-gray-800 relative">
                                        <img src="/car-hatch.png" alt="Car" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs">R$ 85.000</div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-white">Fiat Pulse</h4>
                                        <p className="text-xs text-gray-500 mt-1">Automático • Turbo</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#051815] border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <img src="/logo-dark.png" alt="Zapicar" className="h-8 w-auto brightness-0 invert opacity-50 hover:opacity-100 transition-all" />
                    <p className="text-gray-600 text-sm font-medium">© 2025 Zapicar Tecnologia.</p>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/5562995347257"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full shadow-[0_0_20px_rgba(37,211,102,0.6)] hover:scale-110 transition-transform duration-300 group"
                aria-label="Fale conosco no WhatsApp"
            >
                <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-40"></div>
                <MessageCircle className="w-8 h-8 text-white relative z-10 fill-white" />
            </a>
        </div>
    );
}
