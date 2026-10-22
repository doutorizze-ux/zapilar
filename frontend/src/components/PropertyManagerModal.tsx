import { X, Upload, FileText, Share2, Copy, Check, Home, FileCheck, Bed, Bath, Car as CarIcon, Maximize, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';

const PROPERTY_TYPES = [
    'Casa', 'Apartamento', 'Terreno', 'Lote', 'Chácara', 'Fazenda', 'Comercial', 'Outro'
];

interface PropertyManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

type Tab = 'details' | 'documents' | 'marketing';

export function PropertyManagerModal({ isOpen, onClose, onSuccess, initialData }: PropertyManagerModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const [loading, setLoading] = useState(false);

    // Form Data (Details Tab)
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [docFiles, setDocFiles] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'Casa',
        price: '',
        description: '',
        location: '',
        city: 'Goiânia',
        neighborhood: '',
        address: '',
        cep: '',
        area: 0,
        areaUnit: 'm2',
        bedrooms: 0,
        bathrooms: 0,
        parkingSpaces: 0,
        pool: false,
        security: false,
        elevator: false,
        furnished: false,
        acceptsTrade: false,
        tradeDetails: '',
        isGatedCommunity: false,
        condoName: '',
        directFinancing: false,
        balloonInstallments: '',
        ruralAptitude: '',
        ruralHasWater: false,
        ruralCarGeo: false,
        isShared: false,
        shareCode: '',
    });

    // Marketing Data
    const [marketingText, setMarketingText] = useState('');
    const [copied, setCopied] = useState(false);

    // Initialize
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || initialData.name || '',
                type: initialData.type || 'Casa',
                price: initialData.price ? initialData.price.toString().replace('.', ',') : '',
                description: initialData.description || '',
                location: initialData.location || '',
                city: initialData.city || 'Goiânia',
                neighborhood: initialData.neighborhood || '',
                address: initialData.address || '',
                cep: initialData.cep || '',
                area: initialData.area || 0,
                areaUnit: initialData.areaUnit || 'm2',
                bedrooms: initialData.bedrooms || 0,
                bathrooms: initialData.bathrooms || 0,
                parkingSpaces: initialData.parkingSpaces || 0,
                pool: initialData.pool || false,
                security: initialData.security || false,
                elevator: initialData.elevator || false,
                furnished: initialData.furnished || false,
                acceptsTrade: initialData.acceptsTrade || false,
                tradeDetails: initialData.tradeDetails || '',
                isGatedCommunity: initialData.isGatedCommunity || false,
                condoName: initialData.condoName || '',
                directFinancing: initialData.directFinancing || false,
                balloonInstallments: initialData.balloonInstallments || '',
                ruralAptitude: initialData.ruralAptitude || '',
                ruralHasWater: initialData.ruralHasWater || false,
                ruralCarGeo: initialData.ruralCarGeo || false,
                isShared: initialData.isShared || false,
                shareCode: initialData.shareCode || '',
            });
            setExistingImages(initialData.images || []);
            setDocFiles([]);
            setImageFiles([]);
            generateMarketingText();
        } else {
            setFormData({
                title: '', type: 'Casa', price: '', description: '', location: '',
                city: 'Goiânia', neighborhood: '', address: '', cep: '',
                area: 0, areaUnit: 'm2', bedrooms: 0, bathrooms: 0, parkingSpaces: 0,
                pool: false, security: false, elevator: false, furnished: false,
                acceptsTrade: false, tradeDetails: '', isGatedCommunity: false, condoName: '',
                directFinancing: false, balloonInstallments: '', ruralAptitude: '',
                ruralHasWater: false, ruralCarGeo: false,
                isShared: false, shareCode: '',
            });
            setExistingImages([]);
            setDocFiles([]);
            setImageFiles([]);
        }
    }, [initialData, isOpen]);

    const formatMoneyRequest = (value: string) => {
        if (!value) return 0;
        const clean = value.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        value = (Number(value) / 100).toFixed(2) + '';
        value = value.replace('.', ',');
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setFormData(prev => ({ ...prev, price: value }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Images
    const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);
        }
    };

    const removeNewImage = (idx: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const removeExistingImage = (idx: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== idx));
    };

    // Docs
    const handleDocFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setDocFiles(prev => [...prev, ...files]);
        }
    };

    const removeNewDoc = (idx: number) => {
        setDocFiles(prev => prev.filter((_, i) => i !== idx));
    };

    // Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const payload: any = {
                ...formData,
                price: formatMoneyRequest(formData.price),
                area: Number(formData.area),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                parkingSpaces: Number(formData.parkingSpaces),
                location: `${formData.neighborhood ? `${formData.neighborhood}, ` : ''}${formData.city || 'Goiás'}`,
                images: existingImages
            };

            let propertyId = initialData?.id;

            if (propertyId) {
                // Update
                const res = await fetch(`${API_URL}/properties/${propertyId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Erro ao atualizar imóvel.');
            } else {
                // Create
                const res = await fetch(`${API_URL}/properties`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Erro ao criar imóvel.');
                }
                const newProp = await res.json();
                propertyId = newProp.id;
            }

            // Upload pending images
            if (imageFiles.length > 0 && propertyId) {
                const formDataImages = new FormData();
                imageFiles.forEach(f => formDataImages.append('files', f));

                await fetch(`${API_URL}/properties/${propertyId}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formDataImages
                });
            }

            // Upload pending documents
            if (docFiles.length > 0 && propertyId) {
                const formDataDocs = new FormData();
                docFiles.forEach(f => formDataDocs.append('files', f));

                await fetch(`${API_URL}/properties/${propertyId}/upload-doc`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formDataDocs
                });
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message || 'Falha ao salvar imóvel.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDoc = async (index: number) => {
        if (!initialData || !initialData.documents) return;
        const confirm = window.confirm("Deseja realmente remover este documento?");
        if (!confirm) return;

        const token = localStorage.getItem('token');
        const updatedDocs = [...initialData.documents];
        updatedDocs.splice(index, 1);

        try {
            await fetch(`${API_URL}/properties/${initialData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ documents: updatedDocs })
            });
            initialData.documents = updatedDocs;
            onSuccess();
        } catch (error) {
            console.error("Failed to delete document", error);
            alert("Erro ao excluir documento.");
        }
    };

    // --- Marketing Generator ---
    const generateMarketingText = () => {
        if (!initialData && !formData.title) return;
        const data = initialData || formData;
        const areaStr = data.areaUnit === 'alqueire'
            ? `${data.area} Alqueires Goianos (~${(data.area * 4.84).toFixed(1)} ha)`
            : `${data.area}m²`;

        const text = `🏡 *${data.title} - ${data.type}*
        
📍 Local: ${data.neighborhood ? `${data.neighborhood}, ` : ''}${data.city || 'Goiás'}

📐 Área: ${areaStr}
🛏 Quartos: ${data.bedrooms} | 🚿 Banheiros: ${data.bathrooms} | 🚗 Vagas: ${data.parkingSpaces}

✨ *Destaques:*
${data.pool ? '✅ Piscina\n' : ''}${data.security ? '✅ Segurança / Portaria 24h\n' : ''}${data.elevator ? '✅ Elevador\n' : ''}${data.furnished ? '✅ Mobiliado\n' : ''}${data.isGatedCommunity ? `✅ Condomínio Fechado ${data.condoName ? `(${data.condoName})` : ''}\n` : ''}${data.acceptsTrade ? `🔄 Aceita Permuta: ${data.tradeDetails || 'Avalia veículo ou imóvel menor'}\n` : ''}${data.directFinancing ? '📋 Financiamento direto facilitado c/ balões\n' : ''}
💰 *VALOR: R$ ${data.price}*

Aproveite essa excelente oportunidade em Goiás!
📲 Mande uma mensagem agora para mais informações e agendar visita.

#imoveis #goiania #goias #${data.type.toLowerCase()} #${(data.neighborhood || 'centro').toLowerCase().replace(/\s+/g, '')}`;
        setMarketingText(text);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(marketingText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{initialData ? formData.title : 'Novo Imóvel'}</h3>
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Gerenciador Imobiliário de Goiás</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 gap-6 bg-white z-10">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Home className="w-4 h-4" /> Detalhes
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'documents' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText className="w-4 h-4" /> Documentos {initialData?.documents?.length ? `(${initialData.documents.length})` : ''}
                    </button>
                    <button
                        onClick={() => { setActiveTab('marketing'); generateMarketingText(); }}
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'marketing' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Share2 className="w-4 h-4" /> Copy de Vendas
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">

                    {/* --- DETAILS TAB --- */}
                    {activeTab === 'details' && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload Area */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Galeria de Fotos</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {existingImages.map((img: string, idx: number) => (
                                        <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={img.startsWith('http') ? img : `${API_URL}${img}`} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}

                                    {imageFiles.map((file, idx) => (
                                        <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}

                                    <label className="border-2 border-dashed border-gray-200 hover:border-cyan-500 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-cyan-50/30">
                                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500 font-medium">Add Foto</span>
                                        <input type="file" multiple accept="image/*" onChange={handleImageFiles} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Main Details */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-2">Informações Básicas</h4>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Título do Anúncio</label>
                                        <input required name="title" value={formData.title} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" placeholder="Ex: Casa no Jardins Verona com Piscina" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Tipo de Imóvel</label>
                                            <select name="type" value={formData.type} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white">
                                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Preço (R$)</label>
                                            <input required name="price" value={formData.price} onChange={handlePriceChange} className="w-full mt-1 p-2 border rounded-lg text-sm font-semibold text-cyan-600" placeholder="0,00" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                                            <input name="city" value={formData.city} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" placeholder="Goiânia, Aparecida..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Setor / Bairro</label>
                                            <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" placeholder="Setor Bueno, Marista..." />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Descrição Completa</label>
                                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" rows={4} placeholder="Destaques, acabamentos, localização..." />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-2">Dimensões & Comodidades</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Maximize className="w-3 h-3" /> Área</label>
                                            <div className="flex gap-1.5 mt-1">
                                                <input type="number" name="area" value={formData.area} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" />
                                                <select name="areaUnit" value={formData.areaUnit} onChange={handleChange} className="p-2 border rounded-lg text-xs bg-white font-semibold">
                                                    <option value="m2">m²</option>
                                                    <option value="alqueire">Alqueire Goiano (4,84 ha)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Bed className="w-3 h-3" /> Quartos</label>
                                            <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Bath className="w-3 h-3" /> Banheiros / Suítes</label>
                                            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><CarIcon className="w-3 h-3" /> Vagas</label>
                                            <input type="number" name="parkingSpaces" value={formData.parkingSpaces} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg text-sm" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Comodidades</label>
                                        <div className="flex flex-wrap gap-2.5 mt-2">
                                            {[
                                                { k: 'pool', l: 'Piscina' }, { k: 'security', l: 'Portaria 24h' },
                                                { k: 'elevator', l: 'Elevador' }, { k: 'furnished', l: 'Mobiliado' }
                                            ].map(opt => (
                                                <label key={opt.k} className="flex items-center gap-1.5 cursor-pointer bg-white border px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-xs">
                                                    <input type="checkbox" name={opt.k} checked={(formData as any)[opt.k]} onChange={handleCheckboxChange} className="rounded text-cyan-600" />
                                                    <span>{opt.l}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mercado de Goiás e Negociação */}
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="acceptsTrade" checked={formData.acceptsTrade} onChange={handleCheckboxChange} className="rounded text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-900">🔄 Aceita Permuta (Veículo / Imóvel Menor)</span>
                                        </label>
                                        {formData.acceptsTrade && (
                                            <input name="tradeDetails" value={formData.tradeDetails} onChange={handleChange} className="w-full p-2 border border-emerald-200 rounded-lg text-xs bg-white" placeholder="Ex: Avalia Hilux, SW4 ou lote no Jardins" />
                                        )}

                                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                                            <input type="checkbox" name="isGatedCommunity" checked={formData.isGatedCommunity} onChange={handleCheckboxChange} className="rounded text-purple-600" />
                                            <span className="text-xs font-bold text-purple-900">🛡️ Condomínio Fechado (Jardins / Alphaville)</span>
                                        </label>
                                        {formData.isGatedCommunity && (
                                            <input name="condoName" value={formData.condoName} onChange={handleChange} className="w-full p-2 border border-purple-200 rounded-lg text-xs bg-white" placeholder="Nome do condomínio (ex: Jardins Verona, Aldeia do Vale)" />
                                        )}
                                    </div>

                                    {/* Parceria entre corretores */}
                                    <div className="border-t pt-3">
                                        <label className="flex items-center gap-2 cursor-pointer bg-cyan-50 border border-cyan-100 p-2.5 rounded-xl">
                                            <input type="checkbox" name="isShared" checked={formData.isShared} onChange={handleCheckboxChange} className="rounded text-cyan-600" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-cyan-800 flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Compartilhar para Parceria (50/50)</span>
                                                <span className="text-[11px] text-cyan-600">Gera um código que outros corretores podem usar para vender seu imóvel.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20">{loading ? 'Salvando...' : 'Salvar Imóvel'}</button>
                            </div>
                        </form>
                    )}

                    {/* --- DOCUMENTS TAB --- */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-teal-900 text-lg">Documentação do Imóvel</h3>
                                    <p className="text-teal-700/80 text-sm mt-1">
                                        Armazene matrículas, contratos, certidões negativas e plantas de forma segura.
                                    </p>
                                </div>
                            </div>

                            {/* Existing Documents List */}
                            {initialData?.documents && initialData.documents.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Arquivos Salvos</h4>
                                    <div className="grid gap-3">
                                        {initialData.documents.map((doc: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                                        <FileCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1">{doc.name}</p>
                                                        <p className="text-xs text-gray-500">{new Date(doc.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={doc.url.startsWith('http') ? doc.url : `${API_URL}${doc.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download={doc.name}
                                                        className="px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                                                    >
                                                        Baixar
                                                    </a>
                                                    <button
                                                        onClick={() => handleDeleteDoc(i)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir documento"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-200 hover:border-teal-500 rounded-2xl p-8 text-center bg-white transition-colors">
                                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                <h4 className="font-bold text-gray-700">Anexar Documentos</h4>
                                <p className="text-xs text-gray-500 mt-1 mb-4">Selecione arquivos PDF, imagens ou documentos</p>

                                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors shadow-lg shadow-teal-600/20">
                                    <Upload className="w-4 h-4" />
                                    Selecionar Arquivos
                                    <input type="file" multiple onChange={handleDocFiles} className="hidden" />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* --- MARKETING TAB --- */}
                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-purple-900 text-lg">Copy de Vendas para Redes Sociais</h3>
                                    <p className="text-purple-700/80 text-sm mt-1">
                                        Texto pronto com gatilhos de vendas, dados de Goiás e permuta para postar no Instagram e enviar no WhatsApp.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                                <textarea
                                    value={marketingText}
                                    onChange={(e) => setMarketingText(e.target.value)}
                                    rows={12}
                                    className="w-full p-4 bg-gray-50 rounded-xl font-mono text-sm border-0 focus:ring-2 focus:ring-purple-500 text-gray-800 leading-relaxed"
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copiado!' : 'Copiar Texto'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
