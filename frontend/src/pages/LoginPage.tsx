import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react';

export function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                login(data.access_token, data.user);

                if (data.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                alert('Credenciais inválidas');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white md:grid md:grid-cols-2 lg:grid-cols-[1fr_500px]">

            {/* Left Side - Branding (Hidden on Mobile) */}
            <div className="hidden md:flex flex-col justify-between bg-[#0A1F22] p-12 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl text-white pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <img src="/logo-zapilar-white.svg" alt="Zapilar" className="h-12 w-auto" />
                    </div>
                </div>

                <div className="relative z-10 max-w-lg mb-12">
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        O sistema definitivo para sua imobiliária.
                    </h1>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Gerencie imóveis, automatize o WhatsApp e venda mais com o poder da tecnologia. Tudo em um só lugar.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-gray-500 font-medium">
                    © {new Date().getFullYear()} Zapilar Tecnologia.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-24 bg-white relative">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 md:top-8 md:left-20 flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-600 transition-colors z-20"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar para Home
                </button>

                <div className="w-full max-w-sm mx-auto mt-12 md:mt-0">
                    <div className="mb-10">
                        {/* Mobile Logo Show */}
                        <div className="flex md:hidden items-center justify-center mb-8">
                            <img src="/logo-zapilar.svg" alt="Zapilar" className="h-10 w-auto" />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Bem-vindo de volta!</h2>
                        <p className="mt-2 text-gray-500">
                            Digite suas credenciais para acessar o painel.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-pointer select-none">
                                    Lembrar de mim
                                </label>
                            </div>

                            <div className="text-sm">
                                <button type="button" onClick={() => window.location.href = '/#contact'} className="font-medium text-cyan-600 hover:text-cyan-500">
                                    Esqueceu a senha?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.98]"
                        >
                            {loading ? 'Acessando...' : 'Acessar Painel'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Ainda não tem uma conta?{' '}
                            <button onClick={() => navigate('/register')} className="font-bold text-cyan-600 hover:text-cyan-500 transition-colors">
                                Criar conta grátis
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
