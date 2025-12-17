
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, CreditCard, LogOut, Package, Menu, X, HelpCircle } from 'lucide-react';
import { useState } from 'react';

export function AdminLayout() {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (!user || !isAdmin) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-30 flex items-center justify-between px-4 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
                    <span className="font-bold text-lg">ZapAdmin</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`w-64 bg-slate-900 text-white fixed h-full z-20 transform transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-800 flex items-center gap-3 hidden md:flex">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
                    <span className="font-bold text-lg">ZapAdmin</span>
                </div>

                <nav className="p-4 space-y-2 pt-20 md:pt-4">
                    <button
                        onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </button>

                    <button
                        onClick={() => { navigate('/admin/users'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <Users className="w-5 h-5" />
                        Usuários
                    </button>

                    <button
                        onClick={() => { navigate('/admin/plans'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <Package className="w-5 h-5" />
                        Planos
                    </button>

                    <button
                        onClick={() => { navigate('/admin/financial'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <CreditCard className="w-5 h-5" />
                        Financeiro
                    </button>

                    <button
                        onClick={() => { navigate('/admin/support'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all"
                    >
                        <HelpCircle className="w-5 h-5" />
                        Suporte
                    </button>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Main Content */}
            <main className="md:ml-64 flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
}
