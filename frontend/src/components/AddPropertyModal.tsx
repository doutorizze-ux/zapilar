import { X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const PROPERTY_TYPES = [
    'Casa', 'Apartamento', 'Terreno', 'Casa em Condomínio', 'Cobertura',
    'Flat', 'Loja', 'Sala Comercial', 'Galpão', 'Sítio/Chácara'
];

interface AddPropertyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // For editing
}

export function AddPropertyModal({ isOpen, onClose, onSuccess, initialData }: AddPropertyModalProps) {
    const [loading, setLoading] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    // Initialize form with defaults or initialData
    const [formData, setFormData] = useState({
        title: '',
        type: 'Apartamento',
        price: '', // Stored as string for masking
        location: '',
        city: '',
        neighborhood: '',
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        parkingSpaces: 0,
        description: '',
        pool: false,
        security: false,
        elevator: false,
        furnished: false,
    });

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                type: initialData.type || 'Apartamento',
                price: initialData.price ? initialData.price.toString().replace('.', ',') : '',
                location: initialData.location || '',
                city: initialData.city || '',
                neighborhood: initialData.neighborhood || '',
                area: initialData.area || 0,
                bedrooms: initialData.bedrooms || 0,
                bathrooms: initialData.bathrooms || 0,
                parkingSpaces: initialData.parkingSpaces || 0,
                description: initialData.description || '',
                pool: initialData.pool || false,
                security: initialData.security || false,
                elevator: initialData.elevator || false,
                furnished: initialData.furnished || false,
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const formatMoneyRequest = (value: string) => {
        // Convert "15.000,00" -> 15000.00
        if (!value) return 0;
        const clean = value.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // 1500000
        value = (Number(value) / 100).toFixed(2) + ''; // 15000.00
        value = value.replace('.', ','); // 15000,00
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // 15.000,00
        setFormData(prev => ({ ...prev, price: value }));
    };

    // Auto-update location string
    useEffect(() => {
        if (formData.city || formData.neighborhood) {
            const loc = [formData.neighborhood, formData.city].filter(Boolean).join(', ');
            setFormData(prev => ({ ...prev, location: loc }));
        }
    }, [formData.city, formData.neighborhood]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const payload = {
                ...formData,
                price: formatMoneyRequest(formData.price),
                area: Number(formData.area),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                parkingSpaces: Number(formData.parkingSpaces),
                images: initialData?.images || [] // Keep existing images if editing
            };

            let response;
            if (initialData) {
                // Edit Mode
                response = await fetch(`${API_URL}/properties/${initialData.id}`, { // Updated endpoint
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // Create Mode
                response = await fetch(`${API_URL}/properties`, { // Updated endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (response.ok) {
                const property = await response.json();
                const propertyId = initialData ? initialData.id : property.id;

                // 2. Upload Images if selected
                if (imageFiles.length > 0 && propertyId) {
                    const uploadData = new FormData();
                    imageFiles.forEach(file => {
                        uploadData.append('files', file);
                    });

                    await fetch(`${API_URL}/properties/${propertyId}/upload`, { // Updated endpoint
                        method: 'POST',
                        body: uploadData,
                    });
                }

                onSuccess();
                onClose();
            } else {
                alert('Erro ao salvar imóvel');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            // Limit to 5 images
            const totalFiles = [...imageFiles, ...filesArray].slice(0, 5);
            setImageFiles(totalFiles);
        }
    };

    const removeFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">{initialData ? 'Editar Imóvel' : 'Novo Imóvel'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Image Upload Area */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fotos do Imóvel (Máx: 5)</label>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                            {imageFiles.map((file, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {imageFiles.length < 5 && (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center aspect-square hover:bg-gray-50 transition-colors relative">
                                    <div className="w-8 h-8 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mb-2">
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">+ Adicionar</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                        {initialData && initialData.images && (
                            <p className="text-xs text-gray-400">Imagens atuais serão mantidas. Novas imagens serão adicionadas.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Título do Anúncio</label>
                            <input required name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Ex: Apartamento no Centro" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                            <select required name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none">
                                {PROPERTY_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                                <input required name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Ex: São Paulo" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                                <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Ex: Centro" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$)</label>
                            <input
                                required
                                type="text"
                                name="price"
                                value={formData.price}
                                onChange={handlePriceChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
                                <input required type="number" name="area" value={formData.area} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
                                <input required type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Banheiros</label>
                                <input required type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vagas</label>
                                <input required type="number" name="parkingSpaces" value={formData.parkingSpaces} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Destaques</label>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="pool" checked={formData.pool} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Piscina</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="security" checked={formData.security} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Segurança 24h</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="elevator" checked={formData.elevator} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Elevador</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="furnished" checked={formData.furnished} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Mobiliado</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Completa</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Descreva os detalhes do imóvel..." />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Salvar Imóvel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
