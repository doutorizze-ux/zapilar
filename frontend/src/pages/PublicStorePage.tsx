import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Search, MapPin, Phone, Car, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

interface Vehicle {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    category: string;
    images?: string[];
    fuel?: string;
    km?: number;
    transmission?: string;
}

interface StoreData {
    name: string;
    logoUrl?: string;
    phone?: string;
    primaryColor: string;
    email?: string;
    address?: string; // Add if available
}

export function PublicStorePage() {
    const { slug } = useParams();
    const [store, setStore] = useState<StoreData | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            try {
                // Public endpoint: /users/public/:slug
                const res = await fetch(`${API_URL}/users/public/${slug}`);
                if (!res.ok) {
                    throw new Error('Loja não encontrada');
                }
                const data = await res.json();
                setStore(data.store);
                setVehicles(data.vehicles || []);
                setFilteredVehicles(data.vehicles || []);
            } catch (err) {
                console.error(err);
                setError('Loja não encontrada ou indisponível.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = vehicles.filter(v =>
            v.name?.toLowerCase().includes(term) ||
            v.brand?.toLowerCase().includes(term) ||
            v.model?.toLowerCase().includes(term)
        );
        setFilteredVehicles(filtered);
    }, [searchTerm, vehicles]);

    const getImageUrl = (url?: string) => {
        if (!url) return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1983&auto=format&fit=crop";
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    const handleWhatsappClick = (vehicle?: Vehicle) => {
        if (!store?.phone) return;
        let text = `Olá! Vi o site da ${store.name} e gostaria de saber mais.`;
        if (vehicle) {
            text = `Olá! Vi o *${vehicle.brand} ${vehicle.name}* (${vehicle.year}) no site e tenho interesse.`;
        }
        const link = `https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
                <Car className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Loja não encontrada</h1>
                <p className="text-gray-500">{error || 'Verifique o endereço digitado.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-black/10">
            {/* Hero Section */}
            <div
                className="relative bg-gray-900 text-white pb-24 pt-12 overflow-hidden"
                style={{ backgroundColor: store.primaryColor }}
            >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {store.logoUrl ? (
                            <img
                                src={getImageUrl(store.logoUrl)}
                                alt={store.name}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/20 shadow-xl bg-white"
                            />
                        ) : (
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 flex items-center justify-center text-4xl font-bold border-4 border-white/20">
                                {store.name.charAt(0)}
                            </div>
                        )}

                        <div className="text-center md:text-left flex-1">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-bold mb-2 tracking-tight"
                            >
                                {store.name}
                            </motion.h1>
                            <p className="text-white/80 text-lg flex items-center justify-center md:justify-start gap-2">
                                <MapPin className="w-4 h-4" /> {store.address || 'Seu novo carro está aqui'}
                            </p>
                        </div>

                        {store.phone && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleWhatsappClick()}
                                className="hidden md:flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors"
                            >
                                <MessageCircle className="w-5 h-5 text-green-600" />
                                Fale Conosco
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section with Negative Margin */}
            <div className="container mx-auto px-4 -mt-10 relative z-20 pb-20">
                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-xl p-4 mb-10 flex flex-col md:flex-row gap-4 items-center border border-gray-100/50">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar no estoque (ex: Civic, 2021...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 transition-all outline-none text-gray-800 placeholder:text-gray-400"
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium px-2">
                        {vehicles.length} Veículos encontrados
                    </div>
                </div>

                {/* Vehicle Grid */}
                {filteredVehicles.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhum veículo encontrado</h3>
                        <p className="text-gray-500">Tente ajustar sua busca ou entre em contato.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredVehicles.map((vehicle, index) => (
                            <motion.div
                                key={vehicle.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                            >
                                {/* Image Area */}
                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                    <img
                                        src={getImageUrl(vehicle.images?.[0])}
                                        alt={vehicle.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                        {vehicle.year}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between">
                                        <span className="text-white text-sm font-medium">{vehicle.km ? `${vehicle.km}km` : 'KM não Inf.'}</span>
                                        <span className="text-white text-sm font-medium">{vehicle.fuel}</span>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                                            {vehicle.brand} {vehicle.name}
                                        </h2>
                                        <p className="text-gray-500 font-medium">{vehicle.model}</p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Valor à vista</p>
                                            <p className="text-2xl font-bold text-gray-900" style={{ color: store.primaryColor !== '#000000' ? store.primaryColor : undefined }}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(vehicle.price))}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleWhatsappClick(vehicle)}
                                            className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg group-hover:scale-110"
                                            title="Tenho interesse"
                                        >
                                            <MessageCircle className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
                <div className="container mx-auto px-4 text-center">
                    <h4 className="font-bold text-2xl mb-4">{store.name}</h4>
                    {store.phone && (
                        <p className="text-gray-400 mb-8 flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" /> {store.phone}
                        </p>
                    )}
                    <div className="text-gray-600 text-sm">
                        <p>Desenvolvido com tecnologia <a href="https://zapicar.com.br" className="text-white hover:underline font-medium">ZapCar</a></p>
                    </div>
                </div>
            </footer>

            {/* Floating WA Button for Mobile */}
            {store.phone && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleWhatsappClick()}
                    className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl z-50 md:hidden flex items-center justify-center"
                >
                    <MessageCircle className="w-8 h-8" />
                </motion.button>
            )}
        </div>
    );
}

