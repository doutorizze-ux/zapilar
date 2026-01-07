
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User as UserIcon, Store, Shield } from 'lucide-react';

interface User {
    id: string;
    email: string;
    storeName: string;
    role: string;
    createdAt: string;
    planId?: string;
    subscriptionId?: string;
    document?: string;
    phone?: string;
    password?: string; // Only for updating
}

interface Plan {
    id: string;
    name: string;
    price: number;
}

export function AdminUsersPage() {
    const { token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User>>({});

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchUsers(), fetchPlans()]);
        };
        loadData();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/plans`);
            if (response.ok) {
                const data = await response.json();
                setPlans(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Keep a reference to the password being set before saving
            const newPassword = editingUser.password;

            const payload = {
                ...editingUser,
                subscriptionId: editingUser.planId ? 'MANUAL' : editingUser.subscriptionId
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${editingUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsModalOpen(false);
                fetchUsers();

                // If password was changed, offer to notify via WhatsApp
                if (newPassword && newPassword.trim().length > 0) {
                    const phone = editingUser.phone;
                    const confirmMsg = phone
                        ? `Senha atualizada! Deseja enviar a nova senha para o cliente (${phone}) via WhatsApp?`
                        : `Senha atualizada! O cliente não tem telefone cadastrado para envio automático. Deseja abrir o WhatsApp mesmo assim?`;

                    if (confirm(confirmMsg)) {
                        const targetPhone = phone ? phone.replace(/\D/g, '') : '';
                        const text = encodeURIComponent(`Olá! Sua senha no Zapilar foi redefinida para: *${newPassword}*\n\nAcesse seu painel!`);
                        window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
                    }
                } else {
                    alert('Usuário atualizado com sucesso!');
                }

            } else {
                alert('Erro ao atualizar usuário');
            }
        } catch (error) {
            alert('Erro na requisição');
        }
    };


    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 font-medium text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Usuário / Loja</th>
                                <th className="px-6 py-4">Contato</th>
                                <th className="px-6 py-4">Função</th>
                                <th className="px-6 py-4">Plano</th>
                                <th className="px-6 py-4">Data Cadastro</th>
                                <th className="px-6 py-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Store className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <span className="font-medium text-gray-900">{user.storeName || 'Sem Loja'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">{user.email}</div>
                                        {user.phone && <div className="text-xs text-green-600">{user.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">
                                            {plans.find(p => p.id === user.planId)?.name || (user.planId ? 'Manual/Outro' : 'Sem Plano')}
                                        </span>
                                        {user.subscriptionId === 'MANUAL' && (
                                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Grátis</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                                <input
                                    value={editingUser.storeName || ''}
                                    onChange={e => setEditingUser({ ...editingUser, storeName: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    disabled
                                    value={editingUser.email || ''}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Whatsapp</label>
                                <input
                                    value={editingUser.phone || ''}
                                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="55999999999"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                                <select
                                    value={editingUser.role || 'store_owner'}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="store_owner">Dono de Loja</option>
                                    <option value="store_user">Vendedor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plano (Atribuir Gratuitamente)</label>
                                <select
                                    value={editingUser.planId || ''}
                                    onChange={e => setEditingUser({ ...editingUser, planId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">Sem Plano</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - R$ {plan.price}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Segurança e Dados</h3>
                                <div className="space-y-4">
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <label className="block text-sm font-medium text-yellow-800 mb-1">Redefinir Senha</label>
                                        <input
                                            type="text"
                                            placeholder="Nova senha..."
                                            onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                            className="w-full border border-yellow-300 rounded-lg px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        />
                                        <p className="text-xs text-yellow-700 mt-1">Ao salvar, você poderá enviar esta senha para o WhatsApp do cliente.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ / CPF</label>
                                        <input
                                            value={editingUser.document || ''}
                                            onChange={e => setEditingUser({ ...editingUser, document: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
