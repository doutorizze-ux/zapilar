import { X, Upload, FileText, Share2, Copy, Check, Instagram, Home, FileCheck, Bed, Bath, Car as CarIcon, Maximize, Trash2 } from 'lucide-react';
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
        city: '',
        neighborhood: '',
        address: '',
        cep: '',
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        parkingSpaces: 0,
        pool: false,
        security: false,
        elevator: false,
        furnished: false,
    });

    // Marketing Data
    const [marketingText, setMarketingText] = useState('');
    const [copied, setCopied] = useState(false);

    // Initialize
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || initialData.name || '', // handling potential migration or old field
                type: initialData.type || 'Casa',
                price: initialData.price ? initialData.price.toString().replace('.', ',') : '',
                description: initialData.description || '',
                location: initialData.location || '',
                city: initialData.city || '',
                neighborhood: initialData.neighborhood || '',
                address: initialData.address || '',
                cep: initialData.cep || '',
                area: initialData.area || 0,
                bedrooms: initialData.bedrooms || 0,
                bathrooms: initialData.bathrooms || 0,
                parkingSpaces: initialData.parkingSpaces || 0,
                pool: initialData.pool || false,
                security: initialData.security || false,
                elevator: initialData.elevator || false,
                furnished: initialData.furnished || false,
            });
            setExistingImages(initialData.images || []);
            setDocFiles([]); // Reset pending docs
            setImageFiles([]); // Reset pending images
            generateMarketingText();
        } else {
            setFormData({
                title: '', type: 'Casa', price: '', description: '', location: '',
                city: '', neighborhood: '', address: '', cep: '',
                area: 0, bedrooms: 0, bathrooms: 0, parkingSpaces: 0,
                pool: false, security: false, elevator: false, furnished: false,
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const currentCount = existingImages.length + imageFiles.length;
            const remainingSlots = 5 - currentCount; // Limited to 5 images as requested

            if (remainingSlots <= 0) return;

            const newFiles = Array.from(e.target.files).slice(0, remainingSlots);
            setImageFiles([...imageFiles, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    // --- Document Logic ---
    const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDocFiles([...docFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeDocFile = (index: number) => {
        setDocFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadDocs = async () => {
        if (!initialData || docFiles.length === 0) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const uploadData = new FormData();
            docFiles.forEach(file => uploadData.append('files', file));
            const res = await fetch(`${API_URL}/properties/${initialData.id}/upload-doc`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData
            });

            if (res.status === 401) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                return;
            }

            if (res.ok) {
                alert('Documentos enviados com sucesso!');
                setDocFiles([]);
                onSuccess(); // Refresh parent to get new docs
            } else {
                alert('Erro ao enviar documentos.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDoc = async (docIndex: number) => {
        if (!initialData || !window.confirm('Tem certeza que deseja excluir este documento?')) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const updatedDocs = initialData.documents.filter((_: any, i: number) => i !== docIndex);
            const res = await fetch(`${API_URL}/properties/${initialData.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ documents: updatedDocs })
            });
            if (res.ok) {
                onSuccess(); // Refresh to update list
            } else {
                alert('Erro ao excluir documento.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Você precisa estar logado para realizar esta ação.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                location: formData.location || `${formData.address}${formData.neighborhood ? ', ' + formData.neighborhood : ''}${formData.city ? ', ' + formData.city : ''}`,
                price: formatMoneyRequest(formData.price),
                area: Number(formData.area),
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                parkingSpaces: Number(formData.parkingSpaces),
                images: initialData ? existingImages : []
            };

            let response;
            let propertyId;

            if (initialData) {
                response = await fetch(`${API_URL}/properties/${initialData.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
                propertyId = initialData.id;
            } else {
                response = await fetch(`${API_URL}/properties`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });

                if (response.status === 401) {
                    alert('Sua sessão expirou ou o acesso foi negado. Por favor, saia e entre novamente no sistema.');
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                propertyId = data.id;
            }

            if (response.ok && propertyId) {
                if (imageFiles.length > 0) {
                    const uploadData = new FormData();
                    imageFiles.forEach(file => uploadData.append('files', file));
                    await fetch(`${API_URL}/properties/${propertyId}/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: uploadData
                    });
                }
                onSuccess();
                if (!initialData) onClose();
                else alert('Imóvel atualizado!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.message || 'Erro ao salvar imóvel. Verifique os dados e tente novamente.');
            }
        } catch (error) {
            console.error('Submit property error:', error);
            alert('Erro ao conectar com o servidor. Tente novamente em instantes.');
        } finally {
            setLoading(false);
        }
    };

    // --- Marketing Generator ---
    const generateMarketingText = () => {
        if (!initialData && !formData.title) return;
        const data = initialData || formData;
        const text = `🏡 ${data.title} - ${data.type}
        
📍 ${data.location}

📐 Área: ${data.area}m²
🛏 Quartos: ${data.bedrooms}
🚿 Banheiros: ${data.bathrooms}
🚗 Vagas: ${data.parkingSpaces}

✨ Destaques:
${data.pool ? '✅ Piscina\n' : ''}${data.security ? '✅ Segurança 24h\n' : ''}${data.elevator ? '✅ Elevador\n' : ''}${data.furnished ? '✅ Mobiliado\n' : ''}
💰 VALOR: R$ ${data.price}

Aproveite essa oportunidade! 
📲 Mande uma mensagem para mais informações.

#imoveis #venda #casa #apartamento #oportunidade #${data.location.split(',')[0].trim().toLowerCase().replace(' ', '')}`;
        setMarketingText(text);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(marketingText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- Render Logic ---
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
                            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Gerenciador Imobiliário</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6 gap-6 bg-gray-50/50">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'details' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Home className="w-4 h-4" /> Detalhes
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'documents' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileCheck className="w-4 h-4" /> Documentação
                    </button>
                    <button
                        onClick={() => { setActiveTab('marketing'); generateMarketingText(); }}
                        className={`py-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'marketing' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Share2 className="w-4 h-4" /> Marketing
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
                                    {/* Existing Images */}
                                    {existingImages.map((img: string, idx: number) => (
                                        <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={img.startsWith('http') ? img : `${API_URL}${img}`} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}

                                    {imageFiles.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-cyan-200 ring-2 ring-cyan-100 group">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}

                                    {(existingImages.length + imageFiles.length) < 5 && (
                                        <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center aspect-square hover:bg-gray-50 cursor-pointer transition-colors relative">
                                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                            <span className="text-xs text-gray-500 font-medium">Adicionar Foto</span>
                                            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    {existingImages.length + imageFiles.length} / 5 fotos
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-2">Dados Principais</h4>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Título do Anúncio</label>
                                        <input required name="title" value={formData.title} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Ex: Casa Linda no Centro" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                                            <select name="type" value={formData.type} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg">
                                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Preço (R$)</label>
                                            <input name="price" value={formData.price} onChange={handlePriceChange} className="w-full mt-1 p-2 border rounded-lg font-bold text-cyan-700" placeholder="0,00" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                                            <input name="city" value={formData.city} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Ex: São Paulo" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                                            <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Ex: Centro" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Endereço</label>
                                            <input name="address" value={formData.address} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Rua, Número..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">CEP</label>
                                            <input name="cep" value={formData.cep} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="00000-000" />
                                        </div>
                                    </div>
                                    <div className="hidden">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Localização (Legacy)</label>
                                        <input name="location" value={formData.location} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" placeholder="Endereço, Bairro..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                                        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" rows={3} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-2">Características</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Maximize className="w-3 h-3" /> Área (m²)</label><input type="number" name="area" value={formData.area} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Bed className="w-3 h-3" /> Quartos</label><input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Bath className="w-3 h-3" /> Banheiros</label><input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><CarIcon className="w-3 h-3" /> Vagas</label><input type="number" name="parkingSpaces" value={formData.parkingSpaces} onChange={handleChange} className="w-full mt-1 p-2 border rounded-lg" /></div>
                                    </div>

                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Comodidades</label>
                                        <div className="flex flex-wrap gap-3 mt-2">
                                            {[
                                                { k: 'pool', l: 'Piscina' }, { k: 'security', l: 'Segurança/Portaria' },
                                                { k: 'elevator', l: 'Elevador' }, { k: 'furnished', l: 'Mobiliado' }
                                            ].map(opt => (
                                                <label key={opt.k} className="flex items-center gap-1.5 cursor-pointer bg-white border px-2 py-1 rounded-md hover:bg-gray-50"><input type="checkbox" name={opt.k} checked={(formData as any)[opt.k]} onChange={handleCheckboxChange} className="rounded text-cyan-600" /><span className="text-xs">{opt.l}</span></label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20">{loading ? 'Salvando...' : 'Salvar Imóvel'}</button>
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
                                        Armazene escrituras, contratos, IPTU e plantas.
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

                            {/* Upload New Documents */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Adicionar Documentos</h4>
                                {docFiles.length > 0 && (
                                    <div className="grid gap-2 mb-4">
                                        {docFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-100 rounded-lg">
                                                <span className="text-sm text-cyan-800 font-medium truncate">{file.name}</span>
                                                <button onClick={() => removeDocFile(i)} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50 transition-colors rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer group">
                                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-teal-500 mb-2 transition-colors" />
                                        <span className="text-gray-500 font-medium group-hover:text-teal-600">Clique para selecionar arquivos</span>
                                        <input type="file" multiple onChange={handleDocFileChange} className="hidden" accept=".pdf,image/*" />
                                    </label>
                                </div>
                                {docFiles.length > 0 && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={handleUploadDocs}
                                            disabled={loading}
                                            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center gap-2"
                                        >
                                            {loading ? 'Enviando...' : `Enviar ${docFiles.length} Arquivo(s)`}
                                            <Upload className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- MARKETING TAB --- */}
                    {activeTab === 'marketing' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex items-center gap-4 mb-4">
                                    <Instagram className="w-8 h-8" />
                                    <div>
                                        <h3 className="font-bold text-xl">Legenda para Redes Sociais</h3>
                                        <p className="text-white/80 text-sm">Texto gerado automaticamente para seu post.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <textarea
                                    value={marketingText}
                                    onChange={(e) => setMarketingText(e.target.value)}
                                    className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-xl"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>

                            {/* New Microsite Feature */}
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Share2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl">Site Exclusivo do Imóvel</h3>
                                            <p className="text-white/80 text-sm">Página de alta conversão gerada automaticamente.</p>
                                        </div>
                                    </div>
                                    <a
                                        href={`/loja/imovel/${initialData?.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-xl"
                                    >
                                        Ver Site Exclusivo
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
