import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, CheckCircle, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';

export function WhatsappPage() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('DISCONNECTED');
    const [loading, setLoading] = useState(true);

    // Poll status every 5 seconds
    useEffect(() => {
        const fetchStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/whatsapp/status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setQrCode(data.qr);
                    setStatus(data.status);
                } else {
                    console.error("Status fetch failed", res.status);
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch WhatsApp status", error);
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleReset = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setQrCode(null);
        setLoading(true);

        try {
            await fetch(`${API_URL}/whatsapp/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to reset WhatsApp", error);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Conexão WhatsApp</h2>
                <p className="text-gray-500 mt-1">Conecte seu número para ativar o chatbot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                        {status === 'CONNECTED' ? (
                            <CheckCircle className="w-8 h-8 text-cyan-500" />
                        ) : (
                            <Smartphone className="w-8 h-8 text-blue-600" />
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {status === 'CONNECTED' ? 'WhatsApp Conectado' : 'Conectar Aparelho'}
                        </h3>
                        <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                            {status === 'CONNECTED'
                                ? 'Seu bot está ativo e respondendo mensagens.'
                                : 'Abra o WhatsApp no seu celular e escaneie o código QR.'}
                        </p>
                    </div>

                    {status === 'CONNECTED' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                            Online e Operante
                        </div>
                    )}

                    {status === 'CONNECTED' && (
                        <div className="mt-6">
                            <button
                                onClick={handleReset}
                                className="text-sm text-red-500 hover:text-red-700 font-medium underline flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" /> Desconectar WhatsApp
                            </button>
                        </div>
                    )}
                </div>

                {/* QR Code Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4 text-gray-400">
                            <RefreshCw className="w-8 h-8 animate-spin" />
                            <p>Carregando status...</p>
                        </div>
                    ) : status === 'CONNECTED' ? (
                        <div className="text-center space-y-4">
                            <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center mx-auto">
                                <CheckCircle className="w-16 h-16 text-cyan-500 opacity-20" />
                            </div>
                            <p className="text-sm text-gray-500">Conexão estabelecida com sucesso.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full">
                            {qrCode ? (
                                <div className="space-y-6 text-center mb-8">
                                    <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block">
                                        <QRCode value={qrCode} size={200} />
                                    </div>
                                    <p className="text-sm text-gray-400">Atualiza automaticamente a cada 5s</p>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 mb-8">
                                    <p>Aguardando Código QR...</p>
                                    <p className="text-xs text-gray-400 mt-2">(Verifique se o backend está rodando)</p>
                                </div>
                            )}

                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                            >
                                <RefreshCw className="w-5 h-5" />
                                {qrCode ? 'Gerar Novo QR Code' : 'Forçar Geração de QR'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
