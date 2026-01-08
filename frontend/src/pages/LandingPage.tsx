import { useNavigate } from 'react-router-dom';
import { CheckCircle, TrendingUp, Smartphone, ArrowRight, Play, Home, Key, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { SupportChatWidget } from '../components/SupportChatWidget';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export function LandingPage() {
    const navigate = useNavigate();
    const [logoUrl, setLogoUrl] = useState("/logo-zapilar-white.svg");

    useEffect(() => {
        fetch(`${API_URL}/users/system-config`)
            .then(res => res.json())
            .then(data => {
                if (data.logoUrl) {
                    const url = data.logoUrl.startsWith('http') ? data.logoUrl : `${API_URL}${data.logoUrl}`;
                    setLogoUrl(url);
                }
            })
            .catch(err => console.error("Failed to load system config", err));
    }, []);

    // Custom Turquoise Palette
    // Primary: #00C2CB
    // Dark: #0A1F22

    return (
        <div className="min-h-screen bg-[#0A1F22] font-sans text-white overflow-x-hidden selection:bg-[#00C2CB] selection:text-white">

            {/* Navbar */}
            <nav className="fixed w-full bg-[#0A1F22]/90 z-50 border-b border-white/5 h-16 md:h-20 flex items-center shadow-lg backdrop-blur-md">
                <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
                    {/* Logo - Assuming logo-zapilar-white.svg is available */}
                    <img src={logoUrl} alt="Zapilar" className="h-10 w-auto object-contain" />

                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors border border-transparent hover:border-white/10 px-4 py-2 rounded-full">
                            Entrar
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="hidden md:flex bg-[#00C2CB] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#00A8B0] transition-all hover:scale-105 shadow-lg shadow-[#00C2CB]/20"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-28 pb-12 lg:pt-48 lg:pb-32 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-[#00C2CB] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-[#00A8B0] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
                    <div className="space-y-6 md:space-y-8 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#00C2CB] text-xs md:text-sm font-bold animate-fade-in-up backdrop-blur-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C2CB] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00C2CB]"></span>
                            </span>
                            Profissionalize sua Imobiliária hoje
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                            Venda imóveis no <span className="text-[#25D366]">WhatsApp</span> e tenha seu Site
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400 leading-relaxed font-light max-w-lg mx-auto lg:mx-0">
                            A plataforma completa para corretores e imobiliárias. Atendimento automático 24h e um site incrível integrado ao seu estoque.
                        </p>

                        <div className="space-y-3 py-2 flex flex-col items-center lg:items-start">
                            {[
                                "Bot de WhatsApp inteligente 24h",
                                "Site imobiliário profissional incluso",
                                "Gestão de Leads e CRM simplificado"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle className="w-5 h-5 text-[#00C2CB]" />
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-[#00C2CB] text-white rounded-full font-bold text-lg hover:bg-[#00A8B0] transition-all shadow-xl shadow-[#00C2CB]/20 flex items-center justify-center gap-3 transform hover:scale-105"
                            >
                                <Home className="w-6 h-6" />
                                Escolher meu Plano
                            </button>
                        </div>

                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 pt-4 justify-center lg:justify-start">
                            <span className="text-gray-500">Tecnologia de ponta para corretores 2.0</span>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative mx-auto w-full max-w-[600px] lg:mr-0 z-10 perspective-1000 mt-10 lg:mt-0">
                        {/* Abstract Shape Background */}
                        <div className="absolute top-10 left-10 w-full h-full bg-gradient-to-tr from-[#00C2CB]/20 to-transparent rounded-full blur-3xl -z-10"></div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 1 }}
                            className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                        >
                            <img
                                src="/hero-zapilar.png"
                                alt="Atendimento Imobiliário Profissional"
                                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                            />

                            {/* Floating Badge */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute top-4 right-4 bg-[#00C2CB] text-white p-3 rounded-xl shadow-lg shadow-[#00C2CB]/30 z-30"
                            >
                                <TrendingUp className="w-6 h-6 mb-1" />
                                <div className="font-bold text-sm">+ Eficiência</div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why ZapImóveis */}
            <section className="py-24 bg-[#0d2629] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-bold text-white">
                            A tecnologia que faltava na sua <span className="text-[#00C2CB]">Imobiliária</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Transforme atendimentos demorados em vendas instantâneas com nossa inteligência artificial para corretores.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-[#112D31] bg-opacity-50 p-8 rounded-3xl border border-white/5 hover:border-[#00C2CB]/30 transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-[#00C2CB]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00C2CB]/20 transition-colors">
                                <Smartphone className="w-7 h-7 text-[#00C2CB]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">WhatsApp Automático</h3>
                            <p className="text-gray-400 font-light">
                                Seus clientes recebem fotos e detalhes dos imóveis na hora, direto no WhatsApp, sem você precisar digitar nada.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-[#112D31] bg-opacity-50 p-8 rounded-3xl border border-white/5 hover:border-[#00C2CB]/30 transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-[#00C2CB]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00C2CB]/20 transition-colors">
                                <Globe className="w-7 h-7 text-[#00C2CB]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Seu Site Próprio</h3>
                            <p className="text-gray-400 font-light">
                                Ganhe automaticamente um site moderno e exclusivo para sua imobiliária, totalmente sincronizado com o bot.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-[#112D31] bg-opacity-50 p-8 rounded-3xl border border-white/5 hover:border-[#00C2CB]/30 transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-[#00C2CB]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00C2CB]/20 transition-colors">
                                <Key className="w-7 h-7 text-[#00C2CB]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Gestão de Aluguel e Venda</h3>
                            <p className="text-gray-400 font-light">
                                Controle seu portfólio de casas, apartamentos e terrenos em um único painel simples e intuitivo.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Video / Demo Section */}
            <section className="py-24 bg-[#0A1F22] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <span className="text-[#00C2CB] font-bold tracking-wider uppercase text-sm">Na prática</span>
                    <h2 className="text-3xl font-bold text-white mt-2 mb-8">
                        Veja o cliente encontrando o imóvel ideal
                    </h2>

                    <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 text-white fill-current ml-1" />
                            </div>
                        </div>
                        {/* Placeholder for video */}
                        <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" className="w-full h-full object-cover opacity-80" alt="Video Cover" />
                    </div>
                    <p className="mt-6 text-gray-500 text-sm">
                        * Demonstração de interação real entre cliente e o Bot Zapilar.
                    </p>
                </div>
            </section >

            {/* Site Preview Section */}
            < section className="py-24 bg-gradient-to-b from-[#0d2629] to-[#0A1F22]" >
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6">
                        <h2 className="text-4xl font-bold text-white">
                            Não tem site? <br />
                            <span className="text-[#00C2CB]">Nós criamos um para você.</span>
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Esqueça agências caras e prazos longos. Ao se cadastrar, seu site imobiliário é gerado instantaneamente com seus imóveis, fotos e contato.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-white">
                                <CheckCircle className="w-5 h-5 text-[#00C2CB]" /> Design Premium e Responsivo
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <CheckCircle className="w-5 h-5 text-[#00C2CB]" /> Botão "Falar no WhatsApp" integrado
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <CheckCircle className="w-5 h-5 text-[#00C2CB]" /> Otimizado para o Google (SEO)
                            </li>
                        </ul>
                        <button onClick={() => navigate('/register')} className="mt-4 text-[#00C2CB] font-bold flex items-center gap-2 hover:gap-3 transition-all">
                            Ver modelos disponíveis <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <img
                            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            className="rounded-lg shadow-2xl border border-white/10 transform rotate-2 hover:rotate-0 transition-all duration-500"
                            alt="Site Preview"
                        />
                        <div className="absolute -bottom-6 -left-6 bg-[#00C2CB] p-4 rounded-xl shadow-lg">
                            <p className="text-white font-bold text-lg">Incluso nos Planos</p>
                        </div>
                    </div>
                </div>
            </section >

            {/* Target Audience */}
            < section className="py-20 border-t border-white/5 bg-[#081b1e]" >
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-white mb-10 w-full text-center">Perfeito para o setor imobiliário</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            "Corretores Autônomos",
                            "Imobiliárias",
                            "Construtoras",
                            "Lançamentos",
                            "Locação e Venda"
                        ].map((item, i) => (
                            <div key={i} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-300 font-medium hover:border-[#00C2CB] hover:text-[#00C2CB] transition-colors cursor-default">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* Final CTA */}
            < section className="py-24 bg-[#0A1F22] relative overflow-hidden text-center" >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00C2CB] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Comece a vender mais imóveis hoje
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Junte-se a corretores que já automatizaram seu atendimento e aumentaram suas vendas em até 40%.
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-12 py-5 bg-[#00C2CB] text-white rounded-full font-bold text-lg hover:bg-[#00A8B0] transition-all shadow-xl shadow-[#00C2CB]/20 transform hover:scale-105"
                    >
                        POTENCIALIZAR MINHAS VENDAS
                    </button>
                    <p className="mt-4 text-sm text-gray-500">Transforme sua forma de vender imóveis.</p>
                </div>
            </section >

            {/* Contact Section */}
            < section id="contact" className="py-24 bg-[#051416] relative border-t border-white/5" >
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Fale Conosco</h2>
                        <p className="text-gray-400">Dúvidas sobre a plataforma? Nosso time ajuda você.</p>
                    </div>

                    <form
                        className="bg-[#0A1F22]/50 backdrop-blur-sm p-8 rounded-3xl border border-white/5 space-y-6"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const formData = new FormData(form);
                            const data = Object.fromEntries(formData.entries());

                            try {
                                const response = await fetch(`${API_URL}/support`, {
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
                                <label className="block text-sm font-medium text-gray-400 mb-2">Nome</label>
                                <input required name="name" className="w-full bg-[#051416] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C2CB] transition-colors" placeholder="Seu nome" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">WhatsApp</label>
                                <input required name="whatsapp" className="w-full bg-[#051416] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C2CB] transition-colors" placeholder="(00) 00000-0000" />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                <input required type="email" name="email" className="w-full bg-[#051416] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C2CB] transition-colors" placeholder="seu@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Assunto</label>
                                <select name="subject" className="w-full bg-[#051416] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C2CB] transition-colors appearance-none cursor-pointer">
                                    <option value="Dúvida Comercial">Dúvida Comercial</option>
                                    <option value="Suporte Técnico">Suporte Técnico</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem</label>
                            <textarea required name="message" rows={4} className="w-full bg-[#051416] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00C2CB] transition-colors resize-none" placeholder="Como podemos ajudar?"></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" className="bg-[#00C2CB] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00A8B0] transition-colors shadow-lg shadow-[#00C2CB]/20">
                                Enviar Mensagem
                            </button>
                        </div>
                    </form>
                </div>
            </section >

            {/* Footer */}
            < footer className="bg-[#051416] border-t border-white/5 py-12" >
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <img src={logoUrl} alt="Zapilar" className="h-8 w-auto opacity-50 hover:opacity-100 transition-all" />
                    <p className="text-gray-600 text-sm font-medium">© 2025 Zapilar Tecnologia.</p>
                </div>
            </footer >


            <SupportChatWidget />
        </div >
    );
}
