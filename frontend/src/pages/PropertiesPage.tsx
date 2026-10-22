import { Plus, Search, Home, Bed, Maximize, Share2, Trash2, UploadCloud, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { PropertyManagerModal } from '../components/PropertyManagerModal';
import { ImportPropertiesModal } from '../components/ImportPropertiesModal';

// Interfaces matching backend entity
interface Property {
    id: string;
    title: string;
    type: string;
    price: number;
    area: number;
    areaUnit?: string;
    bedrooms: number;
    images?: string[];
    location: string;
    isSold?: boolean;
    acceptsTrade?: boolean;
    isGatedCommunity?: boolean;
}

export function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

    const [copyCode, setCopyCode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleCopyProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!copyCode) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/properties/copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ shareCode: copyCode })
        });
        if (res.ok) {
            alert('Imóvel copiado com sucesso!');
            setCopyCode('');
            fetchProperties();
        } else {
            alert('Erro ao copiar imóvel. Verifique o código.');
        }
    };

    const handleSetSold = async (id: string, code: string) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/properties/${id}/sell`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ shareCode: code })
        });
        if (res.ok) {
            alert('Imóvel marcado como vendido!');
            fetchProperties();
        } else {
            const data = await res.json().catch(() => ({}));
            alert(data.message || 'Erro ao marcar venda.');
        }
    };

    const fetchProperties = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/properties`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProperties(data);
                } else {
                    setProperties([]);
                }
            } else {
                console.error("Failed to fetch properties:", res.status);
            }
        } catch (err) {
            console.error("Failed to fetch properties", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja EXCLUIR este imóvel permanentemente?")) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/properties/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            fetchProperties();
        } else {
            alert("Erro ao excluir imóvel.");
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingProperty(null);
    };

    const getImageUrl = (url?: string) => {
        if (!url) return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop";
        if (url.includes('localhost:3000')) {
            return url.replace('http://localhost:3000', API_URL).replace('https://localhost:3000', API_URL);
        }
        if (url.startsWith('/')) {
            return `${API_URL}${url}`;
        }
        return url;
    };

    const filteredProperties = properties.filter(p => {
        const s = searchTerm.toLowerCase();
        return (
            p.title?.toLowerCase().includes(s) ||
            p.type?.toLowerCase().includes(s) ||
            p.location?.toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-8">
            <PropertyManagerModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={fetchProperties}
                initialData={editingProperty}
            />

            <ImportPropertiesModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchProperties}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Estoque de Imóveis</h2>
                    <p className="text-gray-500 mt-1">Gerencie seu portfólio e sincronize com portais e CRMs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-cyan-500 text-gray-700 hover:text-cyan-700 rounded-xl font-medium transition-all shadow-sm"
                        title="Importar catálogo via XML do CRM ou Planilha"
                    >
                        <UploadCloud className="w-5 h-5 text-cyan-600" />
                        Importar (XML / Planilha)
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-cyan-600/20"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Imóvel
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título, tipo, setor ou cidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    />
                </div>
                
                <form onSubmit={handleCopyProperty} className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm w-full sm:w-auto">
                    <input 
                        type="text" 
                        value={copyCode} 
                        onChange={e => setCopyCode(e.target.value)} 
                        placeholder="Código de Parceria" 
                        className="px-3 py-1.5 text-sm bg-transparent focus:outline-none w-36"
                    />
                    <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                        Copiar
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse space-y-4">
                            <div className="h-48 bg-gray-100 rounded-xl"></div>
                            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            ) : filteredProperties.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Nenhum imóvel encontrado</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-1 mb-6">
                        Você ainda não tem imóveis cadastrados ou sua busca não retornou resultados.
                    </p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-white border border-cyan-600 text-cyan-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-cyan-50 transition"
                        >
                            Importar do meu CRM (XML)
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-cyan-700 transition"
                        >
                            Cadastrar Imóvel Manual
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProperties.map((property) => (
                        <div key={property.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group flex flex-col justify-between">
                            <div>
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                                    <img
                                        src={getImageUrl(property.images?.[0])}
                                        alt={property.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">
                                            {property.type}
                                        </span>
                                        {property.acceptsTrade && (
                                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                                                Permuta
                                            </span>
                                        )}
                                        {property.isGatedCommunity && (
                                            <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm">
                                                Condomínio
                                            </span>
                                        )}
                                        {property.isSold && (
                                            <span className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                                                Vendido
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <MatchBadge propertyId={property.id} />
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                                        {property.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{property.location}</p>

                                    <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Maximize className="w-4 h-4 text-gray-400" />
                                            {property.area} {property.areaUnit || 'm²'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Bed className="w-4 h-4 text-gray-400" />
                                            {property.bedrooms} Quartos
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 pt-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-50 gap-4">
                                    <span className="text-xl font-bold text-cyan-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(property.price))}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => {
                                                const slug = localStorage.getItem('user_slug') || 'store';
                                                window.open(`/${slug}/imovel/${property.id}`, '_blank');
                                            }}
                                            className="text-xs font-bold text-cyan-600 hover:underline flex items-center gap-1"
                                        >
                                            <Share2 className="w-3 h-3" /> Ver Público
                                        </button>
                                        {!property.isSold && (
                                            <button
                                                onClick={() => {
                                                    const pwd = window.prompt("Digite a Senha de Controle para marcar como VENDIDO:");
                                                    if (pwd) handleSetSold(property.id, pwd);
                                                }}
                                                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                                            >
                                                Marcar Vendido
                                            </button>
                                        )}
                                         <button
                                            onClick={() => handleDeleteProperty(property.id)}
                                            className="text-xs font-bold text-gray-400 hover:text-red-600 flex items-center gap-1"
                                            title="Excluir Imóvel"
                                        >
                                            <Trash2 className="w-3 h-3" /> Excluir
                                        </button>
                                        <button
                                            onClick={() => handleEdit(property)}
                                            className="text-sm font-semibold text-gray-700 hover:text-cyan-600 transition-colors"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MatchBadge({ propertyId }: { propertyId: string }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchMatches = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${API_URL}/leads/matches/${propertyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCount(Array.isArray(data) ? data.length : 0);
                }
            } catch (e) {
                // ignore
            }
        };
        fetchMatches();
    }, [propertyId]);

    if (count === 0) return null;

    return (
        <span className="bg-amber-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md animate-pulse">
            🔥 {count} {count === 1 ? 'interessado' : 'interessados'}
        </span>
    );
}
