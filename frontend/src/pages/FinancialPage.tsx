import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';

export function FinancialPage() {
    const { token } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ description: '', amount: '', type: 'income', category: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [transRes, sumRes] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/financial`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${import.meta.env.VITE_API_URL}/financial/summary`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (transRes.ok) setTransactions(await transRes.json());
        if (sumRes.ok) setSummary(await sumRes.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/financial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            setFormData({ description: '', amount: '', type: 'income', category: '', date: new Date().toISOString().split('T')[0] });
            fetchData();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apagar registro?')) return;
        await fetch(`${import.meta.env.VITE_API_URL}/financial/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700">
                    <Plus className="w-4 h-4" /> Novo Lançamento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-sm font-medium">Entradas</div>
                    <div className="text-2xl font-bold text-cyan-600 mt-1">R$ {Number(summary.income).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-sm font-medium">Saídas</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">R$ {Number(summary.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="text-gray-500 text-sm font-medium">Saldo</div>
                    <div className={`text-2xl font-bold mt-1 ${summary.balance >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>R$ {Number(summary.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Descrição</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Valor</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map((t: any) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{t.description}</td>
                                <td className="px-6 py-4 text-gray-500">{t.category}</td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${t.type === 'income' ? 'text-cyan-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    Nenhum lançamento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Novo Lançamento</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center ${formData.type === 'income' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200'}`}>
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'income'} onChange={() => setFormData({ ...formData, type: 'income' })} />
                                    <div className="flex items-center justify-center gap-2 font-medium"><ArrowUpCircle className="w-4 h-4" /> Entrada</div>
                                </label>
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 text-center ${formData.type === 'expense' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200'}`}>
                                    <input type="radio" name="type" className="hidden" checked={formData.type === 'expense'} onChange={() => setFormData({ ...formData, type: 'expense' })} />
                                    <div className="flex items-center justify-center gap-2 font-medium"><ArrowDownCircle className="w-4 h-4" /> Saída</div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                                    <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <input list="categories" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" />
                                <datalist id="categories">
                                    <option value="Venda de Veículo" />
                                    <option value="Serviços" />
                                    <option value="Comissão" />
                                    <option value="Aluguel" />
                                    <option value="Marketing" />
                                    <option value="Salários" />
                                    <option value="Contas Fixas" />
                                </datalist>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
