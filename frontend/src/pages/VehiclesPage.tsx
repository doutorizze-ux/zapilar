import { Plus, Search, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { VehicleManagerModal } from '../components/VehicleManagerModal';

// Interfaces matching backend entity
interface Vehicle {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    category: 'Novo' | 'Seminovo';
    images?: string[];
}

export function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const fetchVehicles = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/vehicles`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setVehicles(data);
                } else {
                    setVehicles([]);
                }
            } else {
                console.error("Failed to fetch vehicles:", res.status);
            }
        } catch (err) {
            console.error("Failed to fetch vehicles", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingVehicle(null);
    };

    const getImageUrl = (url?: string) => {
        if (!url) return "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";
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
            <VehicleManagerModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={fetchVehicles}
                initialData={editingVehicle}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Veículos</h2>
                    <p className="text-gray-500 mt-1">Gerencie seu estoque de carros.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-green-600/20"
                >
                    <Plus className="w-5 h-5" />
                    Novo Veículo
                </button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, marca ou modelo..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
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
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                <img
                                    src={getImageUrl(vehicle.images?.[0])}
                                    alt={vehicle.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full">
                                    {vehicle.category}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">{vehicle.brand} {vehicle.name}</h3>
                                    <p className="text-gray-500 text-sm">{vehicle.model} • {vehicle.year}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xl font-bold text-green-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(vehicle.price))}
                                    </span>
                                    <button
                                        onClick={() => handleEdit(vehicle)}
                                        className="text-sm font-medium text-gray-500 hover:text-green-600 transition-colors"
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
