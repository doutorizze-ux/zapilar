import { Store, CreditCard, LogOut, Upload, Save, Pencil, Globe, ExternalLink, Bot, BellRing, Sparkles } from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export function SettingsPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState({
        name: "Carregando...",
        email: "...",
        phone: "",
        slug: "",
        primaryColor: "#00C2CB",
        address: "",
        storeDescription: "",
        plan: "Plano Gratuito",
        logoUrl: "",
        coverUrl: "",
        aiAgentName: "Sofia",
        notifyHotLeads: true,
        aiCustomInstructions: ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        slug: "",
        primaryColor: "#00C2CB",
        address: "",
        storeDescription: "",
        aiAgentName: "Sofia",
        notifyHotLeads: true,
        aiCustomInstructions: ""
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [hasWebsiteFeature, setHasWebsiteFeature] = useState(false);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let subInfo = 'Sem Plano';
            let nextBilling = '-';
            let subStatus = 'unknown';

            if (response.ok) {
                const data = await response.json();

                if (data.planId) {
                    try {
                        const planRes = await fetch(`${API_URL}/plans/${data.planId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const planData = await planRes.json();
                        const features = Array.isArray(planData.features)
                            ? planData.features
                            : (typeof planData.features === 'string' ? (planData.features as string).split(',') : []);

                        if (features.some((f: string) => f.includes('Site Personalizado'))) {
                            setHasWebsiteFeature(true);
                        } else {
                            setHasWebsiteFeature(false);
                        }
                    } catch (e) {
                        console.error('Failed to fetch plan details', e);
                    }
                }

                if (data.subscriptionId) {
                    try {
                        const subRes = await fetch(`${API_URL}/subscriptions/my-subscription`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const subData = await subRes.json();
                        subInfo = subData.planName || (subData.status === 'ACTIVE' ? 'Plano Ativo' : 'Plano Pendente');
                        subStatus = subData.latestPaymentStatus === 'RECEIVED' || subData.latestPaymentStatus === 'CONFIRMED' || subData.status === 'ACTIVE' ? 'ACTIVE' : subData.status;

                        if (subData.nextDueDate) {
                            nextBilling = new Date(subData.nextDueDate).toLocaleDateString('pt-BR');
                        }
                    } catch (e) {
                        console.error('Failed to fetch subscription', e);
                    }
                }

                setUser({
                    name: data.storeName || 'Minha Imobiliária',
                    email: data.email,
                    phone: data.phone || '',
                    plan: subInfo,
                    logoUrl: data.logoUrl,
                    slug: data.slug || '',
                    primaryColor: data.primaryColor || '#00C2CB',
                    address: data.address || '',
                    storeDescription: data.storeDescription || '',
                    aiAgentName: data.aiAgentName || 'Sofia',
                    notifyHotLeads: data.notifyHotLeads !== false,
                    aiCustomInstructions: data.aiCustomInstructions || '',
                    status: subStatus,
                    nextBilling: nextBilling
                } as any);

                setEditForm({
                    name: data.storeName || 'Minha Imobiliária',
                    phone: data.phone || '',
                    slug: data.slug || '',
                    primaryColor: data.primaryColor || '#00C2CB',
                    address: data.address || '',
                    storeDescription: data.storeDescription || '',
                    aiAgentName: data.aiAgentName || 'Sofia',
                    notifyHotLeads: data.notifyHotLeads !== false,
                    aiCustomInstructions: data.aiCustomInstructions || ''
                });
            } else {
                if (response.status === 401) navigate('/login');
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    storeName: editForm.name,
                    phone: editForm.phone,
                    slug: editForm.slug,
                    primaryColor: editForm.primaryColor,
                    address: editForm.address,
                    storeDescription: editForm.storeDescription,
                    aiAgentName: editForm.aiAgentName,
                    notifyHotLeads: editForm.notifyHotLeads,
                    aiCustomInstructions: editForm.aiCustomInstructions
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(prev => ({
                    ...prev,
                    name: updatedUser.storeName,
                    phone: updatedUser.phone,
                    slug: updatedUser.slug,
                    primaryColor: updatedUser.primaryColor,
                    address: updatedUser.address,
                    storeDescription: updatedUser.storeDescription,
                    aiAgentName: updatedUser.aiAgentName,
                    notifyHotLeads: updatedUser.notifyHotLeads,
                    aiCustomInstructions: updatedUser.aiCustomInstructions
                }));
                setIsEditing(false);
                alert('Perfil e configurações da IA atualizados com sucesso!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao salvar: ${errorData.message || 'Tente novamente.'}`);
            }
        } catch (error) {
            alert('Erro de conexão ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/logo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUser(prev => ({ ...prev, logoUrl: data.logoUrl }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCover(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/cover`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setUser(prev => ({ ...prev, coverUrl: data.coverUrl }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploadingCover(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-12">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-500 mt-1">Personalize sua imobiliária, o site e a Consultora IA de Goiás.</p>
            </div>

            {/* AI Real Estate Consultant Settings */}
            <div className="bg-gradient-to-br from-cyan-900 via-cyan-950 to-gray-900 rounded-2xl shadow-xl text-white p-6 sm:p-8 relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                                <Bot className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    Consultora IA no WhatsApp <Sparkles className="w-4 h-4 text-cyan-400" />
                                </h3>
                                <p className="text-xs text-cyan-200">Especialista no mercado imobiliário de Goiás (Sem menus robóticos)</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full text-xs font-bold">
                            Ativa no WhatsApp
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-200 mb-1.5">
                                Nome da Consultora Virtual
                            </label>
                            <input
                                value={isEditing ? editForm.aiAgentName : user.aiAgentName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, aiAgentName: e.target.value }))}
                                disabled={!isEditing}
                                placeholder="Sofia"
                                className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                                    isEditing
                                        ? 'bg-white text-gray-900 font-semibold border-2 border-cyan-400'
                                        : 'bg-white/10 text-white border border-white/10'
                                }`}
                            />
                            <p className="text-[11px] text-cyan-300/80 mt-1">Como a IA vai se apresentar para seus clientes.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-200 mb-1.5">
                                Seu WhatsApp Pessoal (Alerta de Leads Quentes)
                            </label>
                            <input
                                value={isEditing ? editForm.phone : user.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                disabled={!isEditing}
                                placeholder="5562999999999"
                                className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                                    isEditing
                                        ? 'bg-white text-gray-900 font-semibold border-2 border-cyan-400'
                                        : 'bg-white/10 text-white border border-white/10'
                                }`}
                            />
                            <p className="text-[11px] text-cyan-300/80 mt-1">Onde você receberá a notificação quando alguém quiser visitar.</p>
                        </div>
                    </div>

                    <div className="pt-1">
                        <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/10 transition">
                            <input
                                type="checkbox"
                                checked={isEditing ? editForm.notifyHotLeads : user.notifyHotLeads}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notifyHotLeads: e.target.checked }))}
                                disabled={!isEditing}
                                className="w-5 h-5 rounded text-cyan-500 cursor-pointer"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold flex items-center gap-1.5 text-white">
                                    <BellRing className="w-4 h-4 text-cyan-400" /> Alerta de Lead Quente Automático
                                </span>
                                <span className="text-xs text-gray-300">
                                    Avisar imediatamente no seu WhatsApp pessoal quando um cliente qualificado quiser visitar ou fechar negócio.
                                </span>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-cyan-200 mb-1.5">
                            Instruções Especiais para a IA (Opcional)
                        </label>
                        <textarea
                            value={isEditing ? editForm.aiCustomInstructions : user.aiCustomInstructions}
                            onChange={(e) => setEditForm(prev => ({ ...prev, aiCustomInstructions: e.target.value }))}
                            disabled={!isEditing}
                            rows={2}
                            placeholder="Ex: Dê prioridade para os lotes no Jardins Verona e avise que aceitamos permuta em caminhonete Hilux/SW4."
                            className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                                isEditing
                                    ? 'bg-white text-gray-900 border-2 border-cyan-400'
                                    : 'bg-white/10 text-white border border-white/10'
                            }`}
                        />
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Dados da Imobiliária</h3>
                            <p className="text-sm text-gray-500">Informações visíveis no seu catálogo e site</p>
                        </div>
                    </div>
                    {isEditing ? (
                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="px-5 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                        >
                            <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 border border-gray-200 text-gray-700 hover:text-cyan-600 rounded-xl transition text-sm font-semibold flex items-center gap-2 hover:bg-gray-50"
                        >
                            <Pencil className="w-4 h-4" /> Editar
                        </button>
                    )}
                </div>

                <div className="p-6 space-y-6">
                    {/* Logos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-gray-100">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Logotipo da Imobiliária</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {user.logoUrl ? (
                                        <img src={user.logoUrl.startsWith('http') ? user.logoUrl : `${API_URL}${user.logoUrl}`} className="w-full h-full object-contain" />
                                    ) : (
                                        <Store className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingLogo}
                                    className="px-3.5 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition"
                                >
                                    {uploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Banner / Capa do Site</label>
                            <div className="flex items-center gap-4">
                                <div className="w-28 h-16 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {user.coverUrl ? (
                                        <img src={user.coverUrl.startsWith('http') ? user.coverUrl : `${API_URL}${user.coverUrl}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-gray-400">Sem Capa</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => coverInputRef.current?.click()}
                                    disabled={uploadingCover}
                                    className="px-3.5 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-700 transition"
                                >
                                    {uploadingCover ? 'Enviando...' : 'Alterar Capa'}
                                </button>
                                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome da Imobiliária</label>
                            <input
                                value={isEditing ? editForm.name : user.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                disabled={!isEditing}
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm ${isEditing ? 'bg-white border-cyan-500 ring-2 ring-cyan-500/20' : 'bg-gray-50 text-gray-600'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Endereço da Sede em Goiás</label>
                            <input
                                value={isEditing ? editForm.address : user.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                disabled={!isEditing}
                                placeholder="Av. T-4, Setor Bueno - Goiânia/GO"
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm ${isEditing ? 'bg-white border-cyan-500 ring-2 ring-cyan-500/20' : 'bg-gray-50 text-gray-600'}`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Apresentação / Sobre Nós</label>
                            <textarea
                                value={isEditing ? editForm.storeDescription : user.storeDescription}
                                onChange={(e) => setEditForm(prev => ({ ...prev, storeDescription: e.target.value }))}
                                disabled={!isEditing}
                                rows={2}
                                placeholder="Especialistas em imóveis de alto padrão e condomínios fechados em Goiânia e região."
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm ${isEditing ? 'bg-white border-cyan-500 ring-2 ring-cyan-500/20' : 'bg-gray-50 text-gray-600'}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link Público do Site</label>
                            <div className="flex gap-2">
                                <input
                                    value={isEditing ? editForm.slug : user.slug}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                    disabled={!isEditing}
                                    placeholder="minhaimobiliaria"
                                    className={`flex-1 px-4 py-2.5 border rounded-xl text-sm lowercase ${isEditing ? 'bg-white border-cyan-500 ring-2 ring-cyan-500/20' : 'bg-gray-50 text-gray-600'}`}
                                />
                                {!isEditing && user.slug && (
                                    <a
                                        href={`/${user.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-cyan-50 text-cyan-600 rounded-xl hover:bg-cyan-100 flex items-center justify-center"
                                        title="Abrir Site"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email de Acesso</label>
                            <input value={user.email} disabled className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 cursor-not-allowed" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <div className="pt-2 flex justify-between items-center">
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-xl transition">
                    <LogOut className="w-4 h-4" /> Sair da Conta
                </button>
            </div>
        </div>
    );
}
