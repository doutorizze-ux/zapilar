import { X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const CAR_BRANDS = [
    'Toyota', 'Honda', 'Hyundai', 'Volkswagen', 'Chevrolet', 'Ford', 'Fiat', 'Jeep', 'Renault', 'Nissan',
    'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Audi', 'Kia', 'Peugeot', 'Citroën', 'Land Rover', 'Volvo', 'Outra'
];

interface AddVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // For editing
}

export function AddVehicleModal({ isOpen, onClose, onSuccess, initialData }: AddVehicleModalProps) {
    const [loading, setLoading] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    // Initialize form with defaults or initialData
    const [formData, setFormData] = useState({
        brand: 'Toyota',
        name: '',
        model: '',
        year: new Date().getFullYear(),
        price: '', // Stored as string for masking "10.000,00"
        category: 'Seminovo',
        km: 0,
        fuel: 'Flex',
        transmission: 'Automático',
        color: '',
        description: '',
        location: '',
        trava: false,
        alarme: false,
        som: false,
        teto: false,
        banco_couro: false,
    });

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                brand: initialData.brand,
                name: initialData.name,
                model: initialData.model || '',
                year: initialData.year,
                price: initialData.price ? initialData.price.toString().replace('.', ',') : '',
                category: initialData.category,
                km: initialData.km,
                fuel: initialData.fuel || 'Flex',
                transmission: initialData.transmission || 'Automático',
                color: initialData.color || '',
                description: initialData.description || '',
                location: initialData.location || '',
                trava: initialData.trava || false,
                alarme: initialData.alarme || false,
                som: initialData.som || false,
                teto: initialData.teto || false,
                banco_couro: initialData.banco_couro || false,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const payload = {
                ...formData,
                price: formatMoneyRequest(formData.price),
                year: Number(formData.year),
                km: Number(formData.km),
                images: initialData?.images || [] // Keep existing images if editing
            };

            let response;
            if (initialData) {
                // Edit Mode
                response = await fetch(`${API_URL}/vehicles/${initialData.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                // Create Mode
                response = await fetch(`${API_URL}/vehicles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (response.ok) {
                const vehicle = await response.json();
                const vehicleId = initialData ? initialData.id : vehicle.id;

                // 2. Upload Images if selected
                if (imageFiles.length > 0 && vehicleId) {
                    const uploadData = new FormData();
                    imageFiles.forEach(file => {
                        uploadData.append('files', file);
                    });

                    await fetch(`${API_URL}/vehicles/${vehicleId}/upload`, {
                        method: 'POST',
                        body: uploadData,
                    });
                }

                onSuccess();
                onClose();
            } else {
                alert('Erro ao salvar veículo');
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
                    <h3 className="text-xl font-bold text-gray-900">{initialData ? 'Editar Veículo' : 'Novo Veículo'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Image Upload Area */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fotos do Veículo (Máx: 5)</label>

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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                            <select required name="brand" value={formData.brand} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none">
                                {CAR_BRANDS.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome/Modelo</label>
                            <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Ex: Hilux" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Versão</label>
                            <input required name="model" value={formData.model} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" placeholder="Ex: SRV 4x4 Diesel" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">KM</label>
                                <input required type="number" name="km" value={formData.km} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none">
                                <option value="Novo">Novo</option>
                                <option value="Seminovo">Seminovo</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Combustível</label>
                            <input name="fuel" value={formData.fuel} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Câmbio</label>
                            <input name="transmission" value={formData.transmission} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                            <input name="color" value={formData.color} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
                            <input name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Opcionais</label>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="trava" checked={formData.trava} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Trava Elétrica</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="alarme" checked={formData.alarme} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Alarme</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="som" checked={formData.som} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Som</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="teto" checked={formData.teto} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Teto Solar</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="banco_couro" checked={formData.banco_couro} onChange={handleCheckboxChange} className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-gray-300" />
                                <span className="text-sm text-gray-700">Banco de Couro</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Salvar Veículo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
