
import { Users, DollarSign, Package, Car, TrendingUp, ArrowRight, Shield, CreditCard, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../config';

interface AdminStats {
    totalUsers: number;
    activePlansCount: number;
    monthlyRevenue: number;
    totalVehicles: number;
    recentUsers: any[];
}

export function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activePlansCount: 0,
        monthlyRevenue: 0,
        totalVehicles: 0,
        recentUsers: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/dashboard/admin-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            label: 'Usuários Totais',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            trend: 'Lojas cadastradas'
        },
        {
            label: 'MRR (Mensal)',
            value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
            trend: 'Faturamento estimado'
        },
        {
            label: 'Veículos na Base',
            value: stats.totalVehicles,
            icon: Car,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            trend: 'Em todas as lojas'
        },
        {
            label: 'Taxa de Assinatura',
            value: `${stats.totalUsers > 0 ? Math.round((stats.activePlansCount / stats.totalUsers) * 100) : 0}%`,
            icon: Package,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            trend: `${stats.activePlansCount} planos ativos`
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Painel Master Admin 🚀</h1>
                    <p className="text-gray-300 max-w-xl">
                        Visão geral de todo o ecossistema ZapCar. Gerencie lojas, planos e acompanhe o crescimento da plataforma.
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none">
                    <Shield className="w-96 h-96 -translate-y-1/3 translate-x-1/4" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Users Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Usuários Recentes</h3>
                        <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {stats.recentUsers.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Nenhum usuário recente.</p>
                        ) : (
                            stats.recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                                            {(user.storeName || user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{user.storeName || 'Loja sem nome'}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.planId ? 'Premium' : 'Gratuito'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions & System Status */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <Link to="/admin/plans" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <Package className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-medium text-gray-700">Gerenciar Planos</span>
                            </Link>
                            <Link to="/admin/users" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-700">Gerenciar Usuários</span>
                            </Link>
                            <Link to="/admin/financial" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="font-medium text-gray-700">Ver Faturamento</span>
                            </Link>
                            <Link to="/admin/system" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                                    <Settings className="w-5 h-5 text-gray-600" />
                                </div>
                                <span className="font-medium text-gray-700">Configurações do Site</span>
                            </Link>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Sistema</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Versão</span>
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">v3.0.0</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Backend</span>
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Online
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Banco de Dados</span>
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Conectado
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
