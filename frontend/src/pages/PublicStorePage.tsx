import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Search, MapPin,
    Home, Bed, Maximize, Bath, Car as CarIcon, Settings,
    CheckCircle2, X, ChevronLeft, ChevronRight, Share2, Menu, Building
} from 'lucide-react';
import { API_URL } from '../config';

// --- Interfaces ---
interface Property {
    id: string;
    title: string;
    type: string;
    price: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    parkingSpaces: number;
    description?: string;
    location: string;
    images?: string[];
    pool?: boolean;
    security?: boolean;
    elevator?: boolean;
    furnished?: boolean;
}

interface StoreData {
    name: string;
    logoUrl?: string;
    coverUrl?: string;
    phone?: string;
    primaryColor: string;
    email?: string;
    address?: string;
    description?: string;
}

// --- Components ---

const PropertyModal = ({ property, store, onClose }: { property: Property, store: StoreData, onClose: () => void }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = property.images && property.images.length > 0
        ? property.images
        : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop"];

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
        const text = `Olá! Vi o imóvel *${property.title}* no site e tenho interesse.`;
        const link = `https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    // Features List
    const features = [
        { label: 'Piscina', value: property.pool },
        { label: 'Segurança 24h', value: property.security },
        { label: 'Elevador', value: property.elevator },
        { label: 'Mobiliado', value: property.furnished },
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
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white md:hidden backdrop-blur-md">
                    <X className="w-5 h-5" />
                </button>

                <div className="w-full md:w-3/5 bg-black relative flex flex-col justify-center h-[40vh] md:h-auto">
                    <div className="relative w-full h-full">
                        <img
                            src={getImageUrl(images[currentImageIndex])}
                            alt={property.title}
                            className="w-full h-full object-contain"
                        />
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
                        <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full text-white text-xs font-medium backdrop-blur-md">
                            {currentImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-2/5 p-6 md:p-8 bg-white overflow-y-auto max-h-[60vh] md:max-h-full scrollbar-thin">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{property.type}</p>
                            <h2 className="text-3xl font-bold text-gray-900 leading-tight">{property.title}</h2>
                            <p className="text-gray-500 font-medium flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {property.location}</p>
                        </div>
                        <button onClick={onClose} className="hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-bold" style={{ color: store.primaryColor }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(property.price))}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Maximize className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Área</p>
                                <p className="font-semibold text-gray-900">{property.area} m²</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Bed className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Quartos</p>
                                <p className="font-semibold text-gray-900">{property.bedrooms}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Bath className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Banheiros</p>
                                <p className="font-semibold text-gray-900">{property.bathrooms}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <CarIcon className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Vagas</p>
                                <p className="font-semibold text-gray-900">{property.parkingSpaces}</p>
                            </div>
                        </div>
                    </div>

                    {features.length > 0 && (
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Destaques</h3>
                            <div className="flex flex-wrap gap-2">
                                {features.map((feat, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                                        {feat.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {property.description && (
                        <div className="mb-8 p-4 bg-gray-50 rounded-2xl">
                            <h3 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Descrição</h3>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
                        </div>
                    )}

                    <div className="mt-auto">
                        <button
                            onClick={handleWhatsappClick}
                            className="w-full py-4 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-3"
                            style={{ backgroundColor: '#25D366' }}
                        >
                            <MessageCircle className="w-6 h-6" />
                            Tenho Interesse
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
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // --- Install Prompt Logic ---
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;
            try {
                const res = await fetch(`${API_URL}/users/public/${slug}`);
                if (!res.ok) throw new Error('Loja não encontrada');
                const data = await res.json();
                setStore(data.store);
                setProperties(data.properties || []);
                setFilteredProperties(data.properties || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedProperty(null);
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [slug]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredProperties(properties.filter(p =>
            p.title.toLowerCase().includes(term) ||
            p.location.toLowerCase().includes(term) ||
            p.type.toLowerCase().includes(term)
        ));
    }, [searchTerm, properties]);

    const getImageUrl = (url?: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    const scrollToSection = (id: string) => {
        setIsMenuOpen(false);
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!store) return;
        document.title = store.name;
        const metaThemeColor = document.querySelector("meta[name='theme-color']");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", store.primaryColor);
        }

        // PWA Manifest
        const dynamicManifest = {
            name: store.name,
            short_name: store.name.slice(0, 15),
            description: store.description || `Confira os imóveis de ${store.name}`,
            start_url: window.location.pathname,
            scope: window.location.pathname,
            display: "standalone",
            background_color: "#ffffff",
            theme_color: store.primaryColor,
            icons: store.logoUrl ? [
                { src: getImageUrl(store.logoUrl), sizes: "192x192", type: "image/png", purpose: "any" },
                { src: getImageUrl(store.logoUrl), sizes: "512x512", type: "image/png", purpose: "any" }
            ] : undefined
        };

        const stringManifest = JSON.stringify(dynamicManifest);
        const blob = new Blob([stringManifest], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);
        let linkManifest = document.querySelector("link[rel='manifest']");
        if (linkManifest) {
            linkManifest.setAttribute('href', manifestURL);
        } else {
            const newLink = document.createElement('link');
            newLink.setAttribute('rel', 'manifest');
            newLink.setAttribute('href', manifestURL);
            document.head.appendChild(newLink);
        }
    }, [store, slug]);

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" /></div>;

    if (!store) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
            <Home className="w-20 h-20 text-gray-300 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 font-sans selection:bg-black/10">
            <AnimatePresence>
                {selectedProperty && (
                    <PropertyModal
                        property={selectedProperty}
                        store={store}
                        onClose={() => setSelectedProperty(null)}
                    />
                )}
            </AnimatePresence>

            {deferredPrompt && (
                <div onClick={handleInstallClick} className="fixed top-24 right-4 z-40 bg-black text-white px-4 py-2 rounded-full shadow-lg cursor-pointer flex items-center gap-2 animate-pulse hover:animate-none">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Instalar App</span>
                </div>
            )}

            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {store.logoUrl ? (
                            <img src={getImageUrl(store.logoUrl)} className="h-14 w-auto object-contain hover:scale-105 transition-transform" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xl">{store.name[0]}</div>
                                <span className="font-bold text-2xl text-gray-900 truncate max-w-[250px] tracking-tight">{store.name}</span>
                            </div>
                        )}
                    </div>

                    <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-500">
                        {deferredPrompt && (
                            <button onClick={handleInstallClick} className="flex items-center gap-2 text-cyan-600 font-bold hover:bg-cyan-50 px-3 py-1 rounded-full transition-colors">
                                <Share2 className="w-4 h-4" /> Instalar App
                            </button>
                        )}
                        <button onClick={() => scrollToSection('stock')} className="hover:text-gray-900 transition-colors">Imóveis</button>
                        <button onClick={() => scrollToSection('about')} className="hover:text-gray-900 transition-colors">Sobre Nós</button>
                        <button onClick={() => scrollToSection('footer')} className="hover:text-gray-900 transition-colors">Contato</button>
                        {store.phone && (
                            <a
                                href={`https://wa.me/${store.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                className="px-5 py-2.5 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-black/20"
                                style={{ backgroundColor: store.primaryColor }}
                            >
                                Fale Conosco
                            </a>
                        )}
                    </div>
                    <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="w-6 h-6 text-gray-700" />
                    </button>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 flex flex-col gap-4">
                        <button onClick={() => scrollToSection('stock')} className="text-left font-medium text-gray-700">Imóveis</button>
                        <button onClick={() => scrollToSection('about')} className="text-left font-medium text-gray-700">Sobre</button>
                        <button onClick={() => scrollToSection('footer')} className="text-left font-medium text-gray-700">Contato</button>
                    </div>
                )}
            </nav>

            <div className="relative h-[40vh] md:h-[50vh] bg-gray-900 overflow-hidden flex items-center justify-center">
                {store.coverUrl ? (
                    <img src={getImageUrl(store.coverUrl)} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" style={{ backgroundColor: store.primaryColor }} />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg"
                    >
                        {store.name}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-white/90 font-medium"
                    >
                        {store.description || "Realizando sonhos através de imóveis de qualidade."}
                    </motion.p>
                </div>
            </div>

            <main id="stock" className="container mx-auto px-4 sm:px-6 py-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Nossos Imóveis</h2>
                        <p className="text-gray-500 mt-2">Confira as melhores oportunidades.</p>
                    </div>
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-2 w-full md:w-96">
                        <div className="p-3 text-gray-400"><Search className="w-5 h-5" /></div>
                        <input
                            type="text"
                            placeholder="Buscar imóvel..."
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredProperties.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Nenhum imóvel encontrado</h3>
                        <p className="text-gray-500">Tente buscar por outro termo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProperties.map((property, idx) => (
                            <motion.div
                                key={property.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-white rounded-3xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-2xl border border-gray-100 flex flex-col"
                                onClick={() => setSelectedProperty(property)}
                            >
                                <div className="aspect-[4/3] relative bg-gray-200 overflow-hidden">
                                    <img
                                        src={getImageUrl(property.images?.[0]) || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop"}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <p className="text-white font-bold text-sm tracking-wide">VER DETALHES</p>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 uppercase tracking-wider shadow-lg">
                                        {property.type}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 truncate">{property.title}</h3>
                                        <p className="text-sm text-gray-500 truncate flex items-center gap-1"><MapPin className="w-3 h-3" /> {property.location}</p>
                                    </div>

                                    <div className="flex items-center gap-4 py-4 border-t border-gray-50 mb-4 mt-auto">
                                        <div className="flex items-center gap-1.5" title="Área">
                                            <Maximize className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">{property.area} m²</span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100"></div>
                                        <div className="flex items-center gap-1.5" title="Quartos">
                                            <Bed className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">{property.bedrooms}</span>
                                        </div>
                                        <div className="w-px h-8 bg-gray-100"></div>
                                        <div className="flex items-center gap-1.5" title="Vagas">
                                            <CarIcon className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-600">{property.parkingSpaces}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-bold" style={{ color: store.primaryColor }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(property.price))}
                                        </p>
                                        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center group-hover:bg-cyan-500 transition-colors shadow-lg">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <section id="about" className="bg-white py-20 border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Sobre a {store.name}</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Somos especialistas em realizar sonhos. Nossa missão é oferecer os melhores imóveis com a garantia e segurança que você precisa.
                    </p>
                    {store.address && (
                        <div className="mt-10 p-6 bg-gray-50 rounded-2xl inline-flex flex-col items-center gap-3 border border-gray-200">
                            <MapPin className="w-8 h-8 text-red-500" />
                            <p className="text-gray-900 font-bold">{store.address}</p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                                target="_blank"
                                className="text-sm text-blue-600 font-medium hover:underline"
                            >
                                Ver no Google Maps &rarr;
                            </a>
                        </div>
                    )}
                </div>
            </section>

            <footer id="footer" className="bg-gray-900 text-white py-16 border-t border-gray-800">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between gap-12">
                    <div className="max-w-xs">
                        {store.logoUrl ? (
                            <img src={getImageUrl(store.logoUrl)} className="h-14 w-auto object-contain mb-6 bg-white p-1 rounded-lg" />
                        ) : (
                            <div className="text-2xl font-bold mb-6">{store.name}</div>
                        )}
                        <p className="text-gray-400 text-sm">
                            A melhor escolha para seu novo imóvel.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6">Contato</h4>
                        <div className="space-y-4">
                            {store.phone && (
                                <a href={`https://wa.me/${store.phone.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                                    <MessageCircle className="w-5 h-5 text-green-500" />
                                    {store.phone} (WhatsApp)
                                </a>
                            )}
                            {store.address && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                    {store.address}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} {store.name}. Todos os direitos reservados. Tecnologia <a href="https://zapilar.online" className="text-white hover:underline">Zapilar</a>.</p>
                </div>
            </footer>
            {store.phone && (
                <a
                    href={`https://wa.me/${store.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="fixed bottom-6 right-6 z-50 p-4 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-transform hover:shadow-green-500/50 flex items-center justify-center animate-bounce-slow"
                    title="Fale conosco no WhatsApp"
                    style={{ animationDuration: '3s' }}
                >
                    <MessageCircle className="w-8 h-8 fill-current" />
                </a>
            )}
        </div>
    );
}
