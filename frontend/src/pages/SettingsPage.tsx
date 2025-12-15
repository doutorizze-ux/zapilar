import { Store, CreditCard, LogOut, MessageCircle, Upload, Save, Pencil, Globe, ExternalLink, Image as ImageIcon } from 'lucide-react';
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
        primaryColor: "#000000",
        address: "",
        storeDescription: "",
        plan: "Plano Gratuito",
        logoUrl: "",
        coverUrl: ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", phone: "", slug: "", primaryColor: "#000000", address: "", storeDescription: "" });
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

                // Check Plan Features
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

                // Fetch Subscription Details
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
                    name: data.storeName || 'Minha Loja',
                    email: data.email,
                    phone: data.phone || '',
                    plan: subInfo,
                    logoUrl: data.logoUrl,
                    slug: data.slug || '',
                    primaryColor: data.primaryColor || '#000000',
                    address: data.address || '',
                    storeDescription: data.storeDescription || '',
                    status: subStatus,
                    nextBilling: nextBilling
                } as any);
                setEditForm({
                    name: data.storeName || 'Minha Loja',
                    phone: data.phone || '',
                    slug: data.slug || '',
                    primaryColor: data.primaryColor || '#000000',
                    address: data.address || '',
                    storeDescription: data.storeDescription || ''
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
                    storeDescription: editForm.storeDescription
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
                    storeDescription: updatedUser.storeDescription
                }));
                setIsEditing(false);
                alert('Perfil atualizado com sucesso!');
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Save error:', response.status, errorData);
                alert(`Erro ao salvar: ${response.status} - ${errorData.message || 'Tente novamente.'}`);
            }
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Erro de conexão ao tentar salvar. Verifique sua internet.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        setUploadingLogo(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/logo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await fetchProfile(); // Refresh to get new logo URL
            } else {
                alert('Erro ao enviar logo. Tente novamente.');
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        setUploadingCover(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/cover`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                await fetchProfile(); // Refresh
            } else {
                alert('Erro ao enviar capa.');
            }
        } catch (error) {
            console.error('Cover upload failed', error);
        } finally {
            setUploadingCover(false);
        }
    };

    const getImageUrl = (url?: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;

        // Em desenvolvimento local, precisamos apontar para o backend explicitamente
        if (import.meta.env.DEV && url.startsWith('/')) {
            return `http://localhost:3000${url}`;
        }

        // Em produção, /uploads/... será servido pelo mesmo domínio (via Nginx proxy)
        // Se a url vier como "http://localhost:3000/..." do banco legado, tentamos corrigir
        if (url.includes('localhost:3000') && !import.meta.env.DEV) {
            return url.replace('http://localhost:3000', '').replace('https://localhost:3000', '');
        }

        return url;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-500 mt-1">Gerencie sua conta, nome da loja e telefone para contato.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                {user.logoUrl ? (
                                    <img src={getImageUrl(user.logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Store className="w-8 h-8 text-gray-400" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Perfil da Loja</h3>
                            <p className="text-sm text-gray-500">
                                {uploadingLogo ? 'Enviando logo...' : 'Clique na logo para alterar'}
                            </p>
                            <button
                                onClick={() => coverInputRef.current?.click()}
                                className="mt-2 text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <ImageIcon className="w-3 h-3" /> {uploadingCover ? 'Enviando...' : 'Alterar Capa do Site'}
                            </button>
                            <input
                                type="file"
                                ref={coverInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleCoverUpload}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
                        <input
                            value={isEditing ? editForm.name : user.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2 border rounded-xl transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp / Telefone (para IA)</label>
                        <input
                            value={isEditing ? editForm.phone : user.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2 border rounded-xl transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Endereço da Loja</label>
                        <input
                            value={isEditing ? editForm.address : (user as any).address}
                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                            disabled={!isEditing}
                            placeholder="Rua Exemplo, 123 - Centro"
                            className={`w-full px-4 py-2 border rounded-xl transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Slogan / Sobre a Loja (Aparece na capa do site)</label>
                        <textarea
                            value={isEditing ? editForm.storeDescription : (user as any).storeDescription}
                            onChange={(e) => setEditForm(prev => ({ ...prev, storeDescription: e.target.value }))}
                            disabled={!isEditing}
                            rows={2}
                            placeholder="Seu próximo carro está aqui. Qualidade, confiança e procedência."
                            className={`w-full px-4 py-2 border rounded-xl transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email de Acesso</label>
                        <input value={user.email} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                    </div>

                    <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" /> Site da Loja
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link da Loja (Apelido)
                                    <span className="text-xs text-gray-400 font-normal ml-2">ex: zapicar.com.br/<b>minhaloja</b></span>
                                </label>
                                {hasWebsiteFeature ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={isEditing ? editForm.slug : (user as any).slug}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                                            disabled={!isEditing}
                                            placeholder="minhaloja"
                                            className={`flex-1 px-4 py-2 border rounded-xl lowercase transition-colors ${isEditing ? 'bg-white border-green-500 ring-2 ring-green-500/20' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                        />
                                        {!(isEditing) && (user as any).slug && (
                                            <a
                                                href={`/${(user as any).slug}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
                                                title="Ver site"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                        Disponível no Plano Enterprise
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={isEditing ? editForm.primaryColor : (user as any).primaryColor}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                                        disabled={!isEditing}
                                        className="h-10 w-16 p-1 rounded border border-gray-200 cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-500 uppercase">{isEditing ? editForm.primaryColor : (user as any).primaryColor}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-end">
                        {isEditing ? (
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Salvando...' : (
                                    <>
                                        <Save className="w-5 h-5" /> Salvar Alterações
                                    </>
                                )}
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="w-full py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-green-600 border border-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Pencil className="w-5 h-5" /> Editar Perfil
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan / Subscription */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Assinatura</h3>
                            <p className="text-sm text-gray-500">Detalhes do seu plano atual</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${(user as any).status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {(user as any).status === 'ACTIVE' ? 'Ativo' : 'Pendente / Inativo'}
                    </span>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                            <p className="font-bold text-gray-900">{user.plan}</p>
                            <p className="text-sm text-gray-500">Próxima renovação em {(user as any).nextBilling || '-'}</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/plans')} className="text-green-600 font-medium hover:underline text-sm">Gerenciar Plano</button>
                    </div>
                </div>
            </div>



            <div className="pt-4 border-t border-gray-200">
                <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5" />
                    Sair da Conta
                </button>
            </div>
        </div>
    );
}
