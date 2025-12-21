import { Plus, Search, Filter, Home, Bed, Maximize } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { PropertyManagerModal } from '../components/VehicleManagerModal';

// Interfaces matching backend entity
interface Property {
    id: string;
    title: string;
    type: string;
    price: number;
    area: number;
    bedrooms: number;
    images?: string[];
    location: string;
}

export function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);

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

    useEffect(() => {
        fetchProperties();
    }, []);

    // Update editingProperty if the underlying data changes (e.g. after upload)
    useEffect(() => {
        if (editingProperty) {
            const updated = properties.find(p => p.id === editingProperty.id);
            if (updated) {
                setEditingProperty(updated);
            }
        }
    }, [properties]);

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingProperty(null);
    };

    const getImageUrl = (url?: string) => {
        if (!url) return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop"; // Real estate placeholder
        if (url.includes('localhost:3000')) {
            return url.replace('http://localhost:3000', API_URL).replace('https://localhost:3000', API_URL);
        }
        if (url.startsWith('/')) {
            return `${API_URL}${url}`;
        }
        return url;
    };

    return (
        <div className="space-y-8">
            <PropertyManagerModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={fetchProperties}
                initialData={editingProperty}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Imóveis</h2>
                    <p className="text-gray-500 mt-1">Gerencie seu portfólio de propriedades.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-cyan-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Novo Imóvel
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título, tipo ou local..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">
                    <Filter className="w-5 h-5" />
                    Filtros
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-4 h-64 animate-pulse bg-gray-100"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <div key={property.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                <img
                                    src={getImageUrl(property.images?.[0])}
                                    alt={property.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full">
                                    {property.type}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{property.title}</h3>
                                    <p className="text-gray-500 text-sm flex items-center gap-1"><Home className="w-3 h-3" /> {property.location}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1"><Maximize className="w-3 h-3" /> {property.area}m²</span>
                                        <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.bedrooms} quartos</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xl font-bold text-cyan-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(property.price))}
                                    </span>
                                    <button
                                        onClick={() => handleEdit(property)}
                                        className="text-sm font-medium text-gray-500 hover:text-cyan-600 transition-colors"
                                    >
                                        Gerenciar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
