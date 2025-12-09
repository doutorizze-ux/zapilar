import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Settings, LogOut, Smartphone, CreditCard, BookOpen, Menu, X } from 'lucide-react';
import { cn } from '../utils';
import { useState, useEffect } from 'react';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/dashboard' },
    { icon: CreditCard, label: 'Planos', path: '/dashboard/plans' },
    { icon: Car, label: 'Veículos', path: '/dashboard/vehicles' },
    { icon: Smartphone, label: 'WhatsApp', path: '/dashboard/whatsapp' },
    { icon: BookOpen, label: 'Treinamento', path: '/dashboard/training' },
    { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
];

export function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [storeInfo, setStoreInfo] = useState<{ name: string; logoUrl: string; subscriptionId?: string; subscriptionStatus?: string } | null>(null);
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

                        if (data.subscriptionId) {
                            try {
                                const subRes = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/my-subscription`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                const subData = await subRes.json();
                                status = subData.status;

                                // Override status if payment is confirmed but subscription status lags
                                if (subData.latestPaymentStatus === 'RECEIVED' || subData.latestPaymentStatus === 'CONFIRMED') {
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
                            subscriptionStatus: status
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
            if ((!storeInfo.subscriptionId || (storeInfo.subscriptionStatus !== 'ACTIVE' && storeInfo.subscriptionStatus !== 'RECEIVED' && storeInfo.subscriptionStatus !== 'CONFIRMED')) && !isPlansPage) {
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
                "fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                "flex flex-col pt-16 md:pt-0" // Add padding top for mobile header
            )}>
                <div className="hidden md:flex p-6 border-b border-gray-100 items-center justify-start h-[88px]">
                    {storeInfo?.name && storeInfo.name !== 'Zapicar' ? (
                        <div className="flex items-center gap-3">
                            {storeInfo.logoUrl && (
                                <img src={storeInfo.logoUrl} alt="Store Logo" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
                            )}
                            <h1 className="text-lg font-bold text-gray-900 truncate max-w-[170px]" title={storeInfo.name}>
                                {storeInfo.name}
                            </h1>
                        </div>
                    ) : (
                        <img src="/logo-dark.png" alt="Zapicar" className="h-10 w-auto" />
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredSidebarItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                                location.pathname === item.path
                                    ? "bg-green-50 text-green-600 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-green-600" : "text-gray-400 group-hover:text-gray-600")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
                        <LogOut className="w-5 h-5" />
                        Sair
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
