import { X } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '../config';

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Erro ao criar lead');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">Novo Lead Manual</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cliente</label>
                        <input
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                            placeholder="Ex: João Silva"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp / Telefone</label>
                        <input
                            required
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                            placeholder="Ex: 5511999999999"
                        />
                        <p className="text-xs text-gray-400 mt-1">Digite apenas números com DDD (ex: 55629...)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Observação Inicial</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                            placeholder="Interesse em Apartamento Centro..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Criar Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
