
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { TermsModal } from '../components/TermsModal';

export function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        storeName: '',
        document: '' // CNPJ/CPF
    });
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch System Config
        fetch(`${API_URL}/users/system-config`)
            .then(res => res.json())
            .then(data => {
                if (data.logoUrl) {
                    const url = data.logoUrl.startsWith('http') ? data.logoUrl : `${API_URL}${data.logoUrl}`;
                    setLogoUrl(url);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Senhas não conferem');
            return;
        }
        setLoading(true);

        try {
            // 1. Register User
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    storeName: formData.storeName,
                    document: formData.document
                }),
            });

            if (response.ok) {
                // Auto login after register
                const loginRes = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email, password: formData.password }),
                });

                if (loginRes.ok) {
                    const data = await loginRes.json();
                    login(data.access_token, data.user);
                    // Redirect to PLANS instead of dashboard
                    navigate('/dashboard/plans');
                } else {
                    navigate('/login');
                }
            } else {
                alert('Erro ao criar conta. Email já pode estar em uso.');
            }
        } catch (error) {
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-numeric
        if (value.length > 14) value = value.slice(0, 14); // Limit to 14 digits

        // Apply mask: 00.000.000/0000-00
        if (value.length > 12) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        } else if (value.length > 8) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
        } else if (value.length > 5) {
            value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
        }

        setFormData({ ...formData, document: value });
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex text-gray-900">

            {/* Left Panel - Visual */}
            <div className="hidden lg:flex w-1/2 bg-cyan-600 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative z-10 text-white max-w-lg">
                    <h2 className="text-4xl font-bold mb-6">Comece sua jornada digital hoje.</h2>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Store className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Seu Site Imobiliário</h3>
                                <p className="text-cyan-100">Gerencie imóveis e receba leads 24h.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Planos Flexíveis</h3>
                                <p className="text-cyan-100">Escolha o plano ideal para o seu negócio.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center p-8 sm:p-20 bg-white">
                <div className="max-w-md mx-auto w-full">
                    <div className="flex items-center justify-between mb-10">
                        <img src={logoUrl || "/logo-zapilar.svg"} alt="Zapilar" className="h-10 w-auto" />
                        <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-500 hover:text-cyan-600 transition-colors flex items-center gap-1">
                            Voltar para o site
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold mb-2">Crie sua conta</h1>
                    <p className="text-gray-500 mb-8">Cadastre sua imobiliária para selecionar um plano.</p>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Imobiliária</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input required name="storeName" value={formData.storeName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" placeholder="Imobiliária Silva" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input required name="document" value={formData.document} onChange={handleDocumentChange} maxLength={18} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" placeholder="00.000.000/0000-00" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Profissional</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" placeholder="voce@imobiliaria.com" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" placeholder="******" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" placeholder="******" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-4">
                            <input
                                required
                                type="checkbox"
                                id="terms"
                                className="mt-1 w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-500">
                                Li e concordo com os <button type="button" onClick={() => setShowTerms(true)} className="text-cyan-600 font-bold hover:underline">Termos de Uso, Segurança e Privacidade</button> da plataforma.
                            </label>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3.5 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20">
                            {loading ? 'Criando conta...' : (
                                <>
                                    Continuar para Planos
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />

                    <p className="text-center mt-8 text-gray-500">
                        Já tem uma conta? <a href="/login" className="text-cyan-600 font-semibold hover:underline">Fazer login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
