import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Settings, LogOut, Smartphone, CreditCard, BookOpen, Menu, X, Calculator, Users, Search } from 'lucide-react';
import { cn } from '../utils';
import { useState, useEffect } from 'react';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/dashboard' },
    { icon: CreditCard, label: 'Planos', path: '/dashboard/plans' },
    { icon: Car, label: 'Veículos', path: '/dashboard/vehicles' },
    { icon: Search, label: 'Consultas', path: '/dashboard/consultas' },
    { icon: Calculator, label: 'Simulador', path: '/dashboard/simulator' },
    { icon: Users, label: 'Leads', path: '/dashboard/leads' },
    { icon: Smartphone, label: 'WhatsApp', path: '/dashboard/whatsapp' },
    { icon: BookOpen, label: 'Treinamento', path: '/dashboard/training' },
    { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
];

export function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [storeInfo, setStoreInfo] = useState<{ name: string; logoUrl: string; subscriptionId?: string; subscriptionStatus?: string; planName?: string; nextDueDate?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        let status = null;

                        let subData = null;
                        if (data.subscriptionId) {
                            try {
                                const subRes = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/my-subscription`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                subData = await subRes.json();
                                status = subData.status;

                                // Stricter check: If payment is not confirmed, treat as PENDING even if subscription is ACTIVE
                                const isPaid = subData.latestPaymentStatus === 'RECEIVED' || subData.latestPaymentStatus === 'CONFIRMED' || subData.latestPaymentStatus === 'COMPLETED';
                                if (!isPaid) {
                                    status = 'PENDING';
                                } else {
                                    status = 'ACTIVE';
                                }
                            } catch (e) {
                                console.error('Failed to fetch subscription status');
                            }
                        }

                        setStoreInfo({
                            name: data.storeName || 'Zapicar',
                            logoUrl: data.logoUrl || '',
                            subscriptionId: data.subscriptionId,
                            subscriptionStatus: status,
                            planName: subData?.planName,
                            nextDueDate: subData?.nextDueDate
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch profile', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                navigate('/login');
            }
        };
        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (!loading && storeInfo) {
            const isPlansPage = location.pathname === '/dashboard/plans';
            if ((!storeInfo.subscriptionId || (storeInfo.subscriptionStatus !== 'ACTIVE' && storeInfo.subscriptionStatus !== 'RECEIVED' && storeInfo.subscriptionStatus !== 'CONFIRMED' && storeInfo.subscriptionStatus !== 'COMPLETED')) && !isPlansPage) {
                navigate('/dashboard/plans');
            }
        }
    }, [loading, storeInfo, location.pathname, navigate]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

    const filteredSidebarItems = (!storeInfo?.subscriptionId)
        ? sidebarItems.filter(item => item.path === '/dashboard/plans')
        : sidebarItems;

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <img src={storeInfo?.logoUrl || "/logo-dark.png"} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="font-bold text-gray-900 truncate max-w-[150px]">{storeInfo?.name || 'Zapicar'}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-20 w-72 bg-[#0B2B26] border-r border-white/5 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 font-sans shadow-2xl",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                "flex flex-col pt-16 md:pt-0"
            )}>
                {/* Sidebar Header with Glow */}
                <div className="relative overflow-hidden p-6 border-b border-white/5 flex items-center justify-start h-[100px]">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-green-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    {storeInfo?.name && storeInfo.name !== 'Zapicar' ? (
                        <div className="flex items-center gap-4 relative z-10 w-full">
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-200"></div>
                                {storeInfo.logoUrl ? (
                                    <img src={storeInfo.logoUrl} alt="Logo" className="relative w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg" />
                                ) : (
                                    <div className="relative w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center border border-white/10 text-white font-bold text-lg shadow-lg">
                                        {storeInfo.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <h1 className="text-white font-bold text-lg truncate leading-tight tracking-tight">
                                    {storeInfo.name}
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-xs text-green-400 font-medium tracking-wide uppercase">Loja Aberta</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <img src="/logo-dark.png" alt="Zapicar" className="h-9 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity" />
                            <span className="text-white/40 text-xs mt-1 font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/5">BETA</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {filteredSidebarItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group font-medium relative overflow-hidden",
                                    isActive
                                        ? "text-white shadow-[0_4px_20px_-8px_rgba(37,211,102,0.5)]"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#25D366] to-[#059669] opacity-100 z-0"></div>
                                )}
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110",
                                        isActive ? "text-white" : "text-gray-500 group-hover:text-green-400"
                                    )}
                                />
                                <span className={cn("relative z-10 tracking-wide text-sm font-semibold", isActive ? "text-white" : "")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section - Plan Status & Logout */}
                <div className="p-4 space-y-4 bg-gradient-to-t from-black/20 to-transparent">
                    {/* Plan Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="flex items-center justify-between relative z-10 mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seu Plano</span>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                storeInfo?.subscriptionStatus === 'ACTIVE'
                                    ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                            )}>
                                {storeInfo?.subscriptionStatus === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                            </span>
                        </div>
                        <p className="text-white font-bold text-sm relative z-10">{storeInfo?.planName || 'Plano Desconhecido'}</p>
                        <p className="text-gray-500 text-xs mt-0.5 relative z-10">
                            {storeInfo?.nextDueDate
                                ? `Renova em ${new Date(storeInfo.nextDueDate).toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' })}`
                                : 'Assinatura Vitalícia'
                            }
                        </p>

                        {/* Progress bar decoration */}
                        <div className="w-full bg-white/10 h-1 rounded-full mt-3 overflow-hidden">
                            <div className="bg-green-500 h-full w-[70%] rounded-full"></div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full"></div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 font-medium group"
                    >
                        <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Encerrar Sessão</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8 pt-20 md:pt-8 w-full">
                <Outlet />
            </main>
        </div>
    );
}
