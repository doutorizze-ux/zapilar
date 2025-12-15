import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Search, MapPin,
    Car, Calendar, Gauge, Fuel, Settings,
    CheckCircle2, X, ChevronLeft, ChevronRight, Share2
} from 'lucide-react';
import { API_URL } from '../config';

// --- Interfaces ---
interface Vehicle {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    category: string;
    images?: string[];
    description?: string;
    // Specs
    km?: number;
    fuel?: string;
    transmission?: string;
    color?: string;
    location?: string;
    // Options
    trava?: boolean;
    alarme?: boolean;
    som?: boolean;
    teto?: boolean;
    banco_couro?: boolean;
    ar_condicionado?: boolean; // Caso adicione depois
    direcao_hidraulica?: boolean;
}

interface StoreData {
    name: string;
    logoUrl?: string;
    phone?: string;
    primaryColor: string;
    email?: string;
    address?: string;
}

// --- Components ---

const VehicleModal = ({ vehicle, store, onClose }: { vehicle: Vehicle, store: StoreData, onClose: () => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = vehicle.images && vehicle.images.length > 0
        ? vehicle.images
        : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80"];

    const getImageUrl = (url: string) => url.startsWith('http') ? url : `${API_URL}${url}`;

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleWhatsappClick = () => {
        if (!store.phone) return;
        const text = `Olá! Vi o *${vehicle.brand} ${vehicle.name}* (${vehicle.year}) no site e tenho interesse.`;
        const link = `https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    // Lista de Opcionais
    const optionals = [
        { label: 'Trava Elétrica', value: vehicle.trava },
        { label: 'Alarme', value: vehicle.alarme },
        { label: 'Som', value: vehicle.som },
        { label: 'Teto Solar', value: vehicle.teto },
        { label: 'Bancos de Couro', value: vehicle.banco_couro },
    ].filter(opt => opt.value);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-6xl max-h-[95vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button Mobile */}
                <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white md:hidden backdrop-blur-md">
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Gallery */}
                <div className="w-full md:w-3/5 bg-black relative flex flex-col justify-center h-[40vh] md:h-auto">
                    <div className="relative w-full h-full">
                        <img
                            src={getImageUrl(images[currentImageIndex])}
                            alt={vehicle.name}
                            className="w-full h-full object-contain"
                        />

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors backdrop-blur-sm">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors backdrop-blur-sm">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-white text-xs font-medium backdrop-blur-md">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </div>

                    {/* Thumbnails (Desktop) */}
                    <div className="hidden md:flex gap-2 p-4 overflow-x-auto bg-neutral-900 scrollbar-hide">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                style={{ borderColor: currentImageIndex === idx ? store.primaryColor : 'transparent' }}
                            >
                                <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-2/5 p-6 md:p-8 bg-white overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-thin">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{vehicle.brand}</p>
                            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{vehicle.name}</h2>
                            <p className="text-gray-500 font-medium">{vehicle.model}</p>
                        </div>
                        <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-bold" style={{ color: store.primaryColor }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(vehicle.price))}
                        </span>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Ano</p>
                                <p className="font-semibold text-gray-900">{vehicle.year}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Gauge className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">KM</p>
                                <p className="font-semibold text-gray-900">{vehicle.km ? `${vehicle.km.toLocaleString()} km` : '---'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Fuel className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Combustível</p>
                                <p className="font-semibold text-gray-900">{vehicle.fuel || 'Flex'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Settings className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Câmbio</p>
                                <p className="font-semibold text-gray-900">{vehicle.transmission || 'Manual'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Optional Features */}
                    {optionals.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Opcionais</h3>
                            <div className="flex flex-wrap gap-2">
                                {optionals.map((opt, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                        {opt.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {vehicle.description && (
                        <div className="mb-8 p-4 bg-gray-50 rounded-2xl">
                            <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Sobre o veículo</h3>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                        </div>
                    )}

                    {/* CTA Footer on Mobile/Desktop */}
                    <div className="mt-auto">
                        <button
                            onClick={handleWhatsappClick}
                            className="w-full py-4 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-3"
                            style={{ backgroundColor: '#25D366' }} // Whatsapp Green
                        >
                            <MessageCircle className="w-6 h-6" />
                            Tenho Interesse
                        </button>

                        <button
                            className="w-full mt-3 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: `${vehicle.brand} ${vehicle.name}`,
                                        text: `Olha esse carro que encontrei na ${store.name}!`,
                                        url: window.location.href,
                                    }).catch(console.error);
                                }
                            }}
                        >
                            <Share2 className="w-4 h-4" /> Compartilhar esse veículo
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Main Page ---

export function PublicStorePage() {
    const { slug } = useParams();
    const [store, setStore] = useState<StoreData | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            try {
                const res = await fetch(`${API_URL}/users/public/${slug}`);
                if (!res.ok) throw new Error('Loja não encontrada');
                const data = await res.json();
                setStore(data.store);
                setVehicles(data.vehicles || []);
                setFilteredVehicles(data.vehicles || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        // Close modal on escape
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedVehicle(null);
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [slug]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredVehicles(vehicles.filter(v =>
            v.name?.toLowerCase().includes(term) ||
            v.brand?.toLowerCase().includes(term) ||
            v.model?.toLowerCase().includes(term)
        ));
    }, [searchTerm, vehicles]);

    const getImageUrl = (url?: string) => {
        if (!url) return "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80";
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" /></div>;

    if (!store) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
            <Car className="w-20 h-20 text-gray-300 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
            <p className="text-gray-500">O endereço que você acessou não existe.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 font-sans selection:bg-black/10">
            <AnimatePresence>
                {selectedVehicle && (
                    <VehicleModal
                        vehicle={selectedVehicle}
                        store={store}
                        onClose={() => setSelectedVehicle(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header / Hero */}
            <header className="relative bg-white pt-6 pb-24 overflow-hidden shadow-sm z-10">
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: `linear-gradient(135deg, ${store.primaryColor}20 0%, transparent 100%)` }}
                />
                <div className="container mx-auto px-4 sm:px-6 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            {store.logoUrl ? (
                                <img src={getImageUrl(store.logoUrl)} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-xl border-4 border-white" />
                            ) : (
                                <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                                    {store.name[0]}
                                </div>
                            )}
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{store.name}</h1>
                                <p className="flex items-center justify-center md:justify-start gap-2 text-gray-500 font-medium mt-1">
                                    <MapPin className="w-4 h-4" /> {store.address || 'Brasil'}
                                </p>
                            </div>
                        </div>
                        {store.phone && (
                            <a
                                href={`https://wa.me/${store.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full font-bold text-gray-900 hover:bg-gray-50 hover:scale-105 transition-all shadow-sm"
                            >
                                <MessageCircle className="w-5 h-5 text-green-600" /> WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-20">
                {/* Search Bar */}
                <div className="bg-white p-2 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-2 max-w-2xl mx-auto mb-12 border border-gray-100">
                    <div className="p-3 text-gray-400"><Search className="w-6 h-6" /></div>
                    <input
                        type="text"
                        placeholder="Qual carro você procura?"
                        className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="hidden sm:block px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {vehicles.length} Veículos
                    </div>
                </div>

                {/* Grid */}
                {filteredVehicles.length === 0 ? (
                    <div className="text-center py-24">
                        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Nenhum veículo encontrado</h3>
                        <p className="text-gray-500">Tente buscar por outro termo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredVehicles.map((vehicle, idx) => (
                            <motion.div
                                key={vehicle.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-2xl border border-gray-100"
                                onClick={() => setSelectedVehicle(vehicle)}
                            >
                                {/* Image Info Overlay */}
                                <div className="aspect-[4/3] relative bg-gray-200 overflow-hidden">
                                    <img
                                        src={getImageUrl(vehicle.images?.[0])}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <Search className="w-4 h-4" /> Ver detalhes
                                        </p>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 uppercase tracking-wider shadow-lg">
                                        {vehicle.year}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{vehicle.brand}</p>
                                        <h3 className="text-xl font-bold text-gray-900 truncate">{vehicle.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{vehicle.model}</p>
                                    </div>

                                    {/* Mini Specs */}
                                    <div className="flex items-center gap-4 py-4 border-t border-gray-50 mb-4">
                                        <div className="flex items-center gap-1.5" title="Quilometragem">
                                            <Gauge className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">
                                                {vehicle.km ? `${Math.round(vehicle.km / 1000)}k` : '-'}
                                            </span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100"></div>
                                        <div className="flex items-center gap-1.5" title="Câmbio">
                                            <Settings className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">
                                                {vehicle.transmission === 'Automatico' ? 'Auto' : 'Man.'}
                                            </span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100"></div>
                                        <div className="flex items-center gap-1.5" title="Combustível">
                                            <Fuel className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">
                                                {vehicle.fuel || 'Flex'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-bold" style={{ color: store.primaryColor }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(vehicle.price))}
                                        </p>
                                        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center group-hover:bg-green-500 transition-colors shadow-lg">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="font-bold text-gray-900 text-xl mb-2">{store.name}</p>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        A melhor seleção de veículos novos e seminovos com a garantia e procedência que você procura.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-400">
                        <span>&copy; {new Date().getFullYear()} Todos os direitos reservados.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
