
import { Upload, Save, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from '../../config';

export function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Config Data
    const [appName, setAppName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#00C2CB');

    useEffect(() => {
        // Fetch Admin Profile as "System Config"
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setAppName(data.storeName || 'Zapilar');
                if (data.logoUrl) {
                    setLogoPreview(data.logoUrl.startsWith('http') ? data.logoUrl : `${API_URL}${data.logoUrl}`);
                }
                setPrimaryColor(data.primaryColor || '#00C2CB');
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            // 1. Update Text Data
            await fetch(`${API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    storeName: appName,
                    primaryColor: primaryColor
                })
            });

            // 2. Upload Logo if changed
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                await fetch(`${API_URL}/users/logo`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
            }

            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar configurações.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-cyan-100 text-cyan-600 rounded-xl">
                        <Settings className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                        <p className="text-gray-500">Altere a identidade visual global da plataforma.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Logo Section */}
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Logo da Plataforma</label>
                        <div className="flex items-start gap-8">
                            <div className="w-32 h-32 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm relative group">
                                {logoPreview ? (
                                    <img src={logoPreview} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-gray-300 font-bold">Sem Logo</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                                    <Upload className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Carregar Nova Logo</span>
                                    <input type="file" onChange={handleLogoChange} accept="image/*" className="hidden" />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Recomendado: PNG ou SVG com fundo transparente.</p>
                                <p className="text-xs text-gray-400 mt-1">Essa logo substituirá a marca "Zapilar" na página inicial e login.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Plataforma</label>
                            <input
                                type="text"
                                value={appName}
                                onChange={e => setAppName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-mono uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
