
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageCircle, MapPin, Bed, Maximize, Bath, Car,
    ChevronLeft, Share2, Calendar, ShieldCheck, Waves, Sofa
} from 'lucide-react';
import { API_URL } from '../config';

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
    phone?: string;
    primaryColor: string;
}

export function PropertyDetailPage() {
    const { slug, propertyId } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [store, setStore] = useState<StoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch store for color/logo
                const storeRes = await fetch(`${API_URL}/users/public/${slug}`);
                if (storeRes.ok) {
                    const data = await storeRes.json();
                    setStore(data.store);
                }

                // Fetch specific property
                const propRes = await fetch(`${API_URL}/properties/${propertyId}`);
                if (propRes.ok) {
                    const data = await propRes.json();
                    setProperty(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug, propertyId]);

    const getImageUrl = (url: string) => url.startsWith('http') ? url : `${API_URL}${url}`;

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" /></div>;
    if (!property || !store) return <div className="h-screen flex flex-col items-center justify-center bg-white text-center p-6"><h1 className="text-2xl font-bold">Imóvel não encontrado</h1></div>;

    const images = property.images && property.images.length > 0 ? property.images : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop"];

    const handleWhatsapp = () => {
        const text = `Olá! Vi o imóvel *${property.title}* e gostaria de mais informações.\nLink: ${window.location.href}`;
        window.open(`https://wa.me/${store.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
            {/* Header / Nav */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 flex items-center">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6">
                    <button onClick={() => navigate(`/${slug}`)} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 font-medium">
                        <ChevronLeft size={20} /> <span className="hidden sm:inline">Voltar para Loja</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {store.logoUrl ? <img src={getImageUrl(store.logoUrl)} className="h-10 w-auto object-contain" /> : <span className="font-bold text-xl">{store.name}</span>}
                    </div>
                    <button onClick={() => navigator.share({ title: property.title, url: window.location.href })} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Share2 size={20} />
                    </button>
                </div>
            </nav>

            {/* Hero Gallery */}
            <div className="pt-20 px-4 md:px-6">
                <div className={`max-w-7xl mx-auto grid grid-cols-1 ${images.length > 1 ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-4 h-[60vh] md:h-[75vh]`}>
                    <div className={`${images.length > 1 ? 'lg:col-span-3' : ''} relative h-full rounded-3xl overflow-hidden bg-gray-100 shadow-xl shadow-black/5`}>
                        <motion.img
                            key={activeImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            src={getImageUrl(images[activeImage])}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 md:p-12">
                            <span className="bg-white/90 backdrop-blur-md text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                                {property.type}
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">{property.title}</h1>
                        </div>
                    </div>

                    {images.length > 1 && (
                        <div className="hidden lg:grid grid-rows-3 gap-4 h-full">
                            {images.slice(1, 4).map((img, idx) => (
                                <div key={idx} onClick={() => setActiveImage(idx + 1)} className="cursor-pointer overflow-hidden rounded-2xl bg-gray-100 hover:brightness-75 transition-all shadow-lg hover:scale-[1.02]">
                                    <img src={getImageUrl(img)} className="w-full h-full object-cover" />
                                </div>
                            ))}
                            {images.length > 4 && (
                                <div className="relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100 group">
                                    <img src={getImageUrl(images[4])} className="w-full h-full object-cover brightness-50 group-hover:brightness-40 transition-all" />
                                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                                        +{images.length - 4} fotos
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-16">
                    <div className="flex-1">
                        {/* Specs Bar */}
                        <div className="flex flex-wrap items-center gap-8 py-8 border-b border-gray-100 mb-8">
                            <div className="flex items-center gap-3">
                                <Maximize className="text-gray-400" size={24} />
                                <div><p className="text-xs text-gray-500 font-bold uppercase">Área Total</p><p className="text-lg font-bold">{property.area} m²</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Bed className="text-gray-400" size={24} />
                                <div><p className="text-xs text-gray-500 font-bold uppercase">Quartos</p><p className="text-lg font-bold">{property.bedrooms}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Bath className="text-gray-400" size={24} />
                                <div><p className="text-xs text-gray-500 font-bold uppercase">Suítes / WC</p><p className="text-lg font-bold">{property.bathrooms}</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Car className="text-gray-400" size={24} />
                                <div><p className="text-xs text-gray-500 font-bold uppercase">Vagas</p><p className="text-lg font-bold">{property.parkingSpaces}</p></div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <MapPin className="text-red-500" /> Localização
                            </h3>
                            <p className="text-lg text-gray-600 font-medium mb-4">{property.location}</p>
                        </div>

                        {/* Description */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold mb-6">Sobre o Imóvel</h3>
                            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                                {property.description || "Nenhuma descrição detalhada disponível."}
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold mb-6 text-gray-900">Infraestrutura & Lazer</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {property.pool && <Amenity icon={<Waves />} label="Piscina Privativa" />}
                                {property.security && <Amenity icon={<ShieldCheck />} label="Segurança 24h" />}
                                {property.furnished && <Amenity icon={<Sofa />} label="Totalmente Mobiliado" />}
                                <Amenity icon={<Calendar />} label="Pronto para morar" />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / CTA */}
                    <div className="w-full lg:w-[400px]">
                        <div className="sticky top-24 p-8 bg-neutral-900 rounded-[32px] text-white shadow-2xl shadow-black/20">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Valor de Investimento</p>
                            <h4 className="text-4xl font-black mb-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(property.price))}
                            </h4>
                            <p className="text-xs text-gray-500 mb-8 border-b border-white/10 pb-6 uppercase">Documentação Regularizada</p>

                            <div className="space-y-4">
                                <button
                                    onClick={handleWhatsapp}
                                    className="w-full py-5 bg-[#25D366] text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    <MessageCircle className="w-6 h-6 fill-current" />
                                    AGENDAR VISITA AGORA
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3 print:hidden"
                                >
                                    GERAR LÂMINA (PDF)
                                </button>
                                <p className="text-center text-xs text-gray-500 font-medium">Respondemos em média em 2 minutos</p>
                            </div>

                            <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-bold text-xl">
                                    {store.name[0]}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Anunciado por</p>
                                    <p className="font-bold text-lg">{store.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Amenity({ icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-sm text-gray-700">
            <span className="text-gray-400">{icon}</span>
            {label}
        </div>
    )
}
