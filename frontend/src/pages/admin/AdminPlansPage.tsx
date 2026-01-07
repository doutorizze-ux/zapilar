
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash, Check } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    propertyLimit?: number;
    features: string[];
    isActive: boolean;
}

export function AdminPlansPage() {
    const { token } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<Plan>>({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/plans`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setPlans(data);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        // Convert features string to array if needed (simple handler)
        const payload = {
            ...editingPlan,
            price: Number(editingPlan.price),
            propertyLimit: editingPlan.propertyLimit ? Number(editingPlan.propertyLimit) : 50,
            features: Array.isArray(editingPlan.features) ? editingPlan.features : String(editingPlan.features).split(',').map(s => s.trim())
        };

        try {
            if (editingPlan.id) {
                await fetch(`${import.meta.env.VITE_API_URL}/plans/${editingPlan.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(payload)
                });
            } else {
                await fetch(`${import.meta.env.VITE_API_URL}/plans`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            alert('Erro ao salvar plano');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/plans/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPlans();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h1>
                <button
                    onClick={() => { setEditingPlan({}); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Novo Plano
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(plan.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                        <div className="text-3xl font-bold text-gray-900 mt-2">
                            R$ {plan.price} <span className="text-sm text-gray-500 font-normal">/{plan.interval}</span>
                        </div>

                        <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                            Limite: <strong>{plan.propertyLimit || '∞'}</strong> imóveis
                        </div>

                        <div className="mt-6 space-y-3">
                            {(plan.features || []).map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="w-4 h-4 text-green-500" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingPlan.id ? 'Editar' : 'Novo'} Plano</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    required
                                    value={editingPlan.name || ''}
                                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={editingPlan.price || ''}
                                        onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Imóveis</label>
                                    <input
                                        type="number"
                                        value={editingPlan.propertyLimit || ''}
                                        onChange={e => setEditingPlan({ ...editingPlan, propertyLimit: Number(e.target.value) })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo</label>
                                <select
                                    value={editingPlan.interval || 'MONTHLY'}
                                    onChange={e => setEditingPlan({ ...editingPlan, interval: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="QUARTERLY">Trimestral</option>
                                    <option value="SEMIANNUALLY">Semestral</option>
                                    <option value="YEARLY">Anual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Recursos Premium</label>
                                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <input
                                        type="checkbox"
                                        id="websiteToggle"
                                        checked={Array.isArray(editingPlan.features)
                                            ? editingPlan.features.some(f => f.includes('Site Personalizado'))
                                            : String(editingPlan.features || '').includes('Site Personalizado')
                                        }
                                        onChange={e => {
                                            const isChecked = e.target.checked;
                                            const featureName = "Site Personalizado (zapilar.online/nome-loja)";
                                            let currentFeatures = Array.isArray(editingPlan.features)
                                                ? [...editingPlan.features]
                                                : (editingPlan.features ? String(editingPlan.features).split(',').map(s => s.trim()) : []);

                                            if (isChecked) {
                                                if (!currentFeatures.some(f => f.includes('Site Personalizado'))) {
                                                    currentFeatures.push(featureName);
                                                }
                                            } else {
                                                currentFeatures = currentFeatures.filter(f => !f.includes('Site Personalizado'));
                                            }
                                            setEditingPlan({ ...editingPlan, features: currentFeatures });
                                        }}
                                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                    />
                                    <label htmlFor="websiteToggle" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                                        Incluir Geração de Site Próprio
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Outras Funcionalidades (separadas por vírgula)</label>
                                <textarea
                                    value={Array.isArray(editingPlan.features) ? editingPlan.features.join(', ') : editingPlan.features || ''}
                                    onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value.split(',') })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                                    placeholder="Ex: 50 Imóveis, WhatsApp Ilimitado, Suporte 24h..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
