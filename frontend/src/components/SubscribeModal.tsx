
import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Lock, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SubscribeModalProps {
    plan: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function SubscribeModal({ plan, onClose, onSuccess }: SubscribeModalProps) {
    const { token, user } = useAuth();
    const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Method, 2: Details (if CC), 3: Success/Pix
    const [pixCode, setPixCode] = useState('');
    const [pixImage, setPixImage] = useState('');

    const [cardData, setCardData] = useState({
        holderName: '',
        number: '',
        expiryMonth: '',
        expiryYear: '',
        ccv: ''
    });

    const [holderInfo, setHolderInfo] = useState({
        name: user?.storeName || '',
        email: user?.email || '',
        cpfCnpj: user?.document || '',
        postalCode: '',
        addressNumber: '',
        phone: user?.phone || ''
    });

    useEffect(() => {
        let interval: any;
        if (step === 3 && billingType === 'PIX') {
            interval = setInterval(async () => {
                try {
                    const timestamp = new Date().getTime();
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/my-subscription?t=${timestamp}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.status === 'ACTIVE' || data.latestPaymentStatus === 'RECEIVED' || data.latestPaymentStatus === 'CONFIRMED') {
                            // alert('Pagamento Confirmado!'); // Optional: removed alert for smoother UX
                            onSuccess();
                            onClose();
                        }
                    }
                } catch (error) {
                    console.error('Error checking payment status', error);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, billingType, token, onSuccess, onClose]);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const payload: any = {
                planId: plan.id,
                billingType
            };

            if (billingType === 'CREDIT_CARD') {
                // Ensure 4 digit year
                const year = cardData.expiryYear.length === 2 ? `20${cardData.expiryYear}` : cardData.expiryYear;
                payload.creditCard = {
                    ...cardData,
                    expiryYear: year
                };
            }
            // Always send holder info cleaner
            payload.creditCardHolderInfo = {
                ...holderInfo,
                cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ''),
                postalCode: holderInfo.postalCode.replace(/\D/g, ''),
                phone: holderInfo.phone.replace(/\D/g, '')
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                    return;
                }

                if (billingType === 'PIX' && data.pixQrCode) {
                    setPixCode(data.pixQrCode.payload);
                    setPixImage(data.pixQrCode.encodedImage);
                    setStep(3); // Go to Pix display step
                } else {
                    alert('Assinatura realizada com sucesso!');
                    onSuccess();
                    onClose();
                }
            } else {
                alert(`Erro: ${data.message || 'Falha ao assinar'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Assinar {plan.name}</h2>
                        <p className="text-sm text-gray-500">R$ {plan.price.toFixed(2).replace('.', ',')} / {plan.interval === 'MONTHLY' ? 'mês' : plan.interval}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="font-medium text-gray-700">Escolha a forma de pagamento:</p>

                            <button
                                onClick={() => setBillingType('PIX')}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${billingType === 'PIX' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200">
                                    <QrCode className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-gray-900">PIX</span>
                                    <span className="text-sm text-gray-500">Aprovação imediata</span>
                                </div>
                                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${billingType === 'PIX' ? 'border-green-500' : 'border-gray-300'}`}>
                                    {billingType === 'PIX' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                </div>
                            </button>

                            <button
                                onClick={() => setBillingType('CREDIT_CARD')}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${billingType === 'CREDIT_CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-gray-200">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-gray-900">Cartão de Crédito</span>
                                    <span className="text-sm text-gray-500">Renovação automática</span>
                                </div>
                                <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${billingType === 'CREDIT_CARD' ? 'border-blue-500' : 'border-gray-300'}`}>
                                    {billingType === 'CREDIT_CARD' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {billingType === 'CREDIT_CARD' && (
                                <>
                                    <h3 className="font-bold text-gray-900 border-b pb-2">Dados do Cartão</h3>
                                    <div className="space-y-3">
                                        <input placeholder="Nome no Cartão" className="w-full border rounded-lg p-3" value={cardData.holderName} onChange={e => setCardData({ ...cardData, holderName: e.target.value })} />
                                        <input placeholder="Número do Cartão" className="w-full border rounded-lg p-3" value={cardData.number} onChange={e => setCardData({ ...cardData, number: e.target.value })} maxLength={19} />
                                        <div className="flex gap-3">
                                            <input placeholder="Mês (Ex: 12)" className="w-1/3 border rounded-lg p-3" value={cardData.expiryMonth} onChange={e => setCardData({ ...cardData, expiryMonth: e.target.value })} maxLength={2} />
                                            <input placeholder="Ano (Ex: 2028)" className="w-1/3 border rounded-lg p-3" value={cardData.expiryYear} onChange={e => setCardData({ ...cardData, expiryYear: e.target.value })} maxLength={4} />
                                            <input placeholder="CCV" className="w-1/3 border rounded-lg p-3" value={cardData.ccv} onChange={e => setCardData({ ...cardData, ccv: e.target.value })} maxLength={4} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <h3 className="font-bold text-gray-900 border-b pb-2 pt-2">Dados do Titular</h3>
                            <p className="text-xs text-gray-500 mb-2">Necessário para emitir a cobrança</p>
                            <div className="space-y-3">
                                <input placeholder="Nome Completo" className="w-full border rounded-lg p-3" value={holderInfo.name} onChange={e => setHolderInfo({ ...holderInfo, name: e.target.value })} />
                                <input placeholder="Email" className="w-full border rounded-lg p-3" value={holderInfo.email} onChange={e => setHolderInfo({ ...holderInfo, email: e.target.value })} />
                                <input placeholder="CPF/CNPJ" className="w-full border rounded-lg p-3" value={holderInfo.cpfCnpj} onChange={e => setHolderInfo({ ...holderInfo, cpfCnpj: e.target.value })} />
                                <div className="flex gap-3">
                                    <input placeholder="CEP" className="w-1/2 border rounded-lg p-3" value={holderInfo.postalCode} onChange={e => setHolderInfo({ ...holderInfo, postalCode: e.target.value })} />
                                    <input placeholder="Número" className="w-1/2 border rounded-lg p-3" value={holderInfo.addressNumber} onChange={e => setHolderInfo({ ...holderInfo, addressNumber: e.target.value })} />
                                </div>
                                <input placeholder="Telefone com DDD" className="w-full border rounded-lg p-3" value={holderInfo.phone} onChange={e => setHolderInfo({ ...holderInfo, phone: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Pagamento via PIX</h3>
                                <p className="text-gray-500 text-sm mt-1">Escaneie o QR Code abaixo para pagar</p>
                            </div>

                            {pixImage && (
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 inline-block">
                                    <img src={`data:image/png;base64,${pixImage}`} alt="Pix QR Code" className="w-48 h-48" />
                                </div>
                            )}

                            <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                                <p className="text-xs text-gray-500 font-mono break-all text-left flex-1 line-clamp-2">
                                    {pixCode}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(pixCode);
                                        alert('Código copiado!');
                                    }}
                                    className="text-blue-600 font-bold text-xs whitespace-nowrap hover:underline"
                                >
                                    COPIAR
                                </button>
                            </div>

                            <p className="text-xs text-gray-400">
                                Após o pagamento, sua assinatura será ativada automaticamente em alguns instantes.
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {step === 2 && (
                        <button onClick={() => setStep(1)} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">Voltar</button>
                    )}

                    {step === 3 ? (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Fechar
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (step === 1) {
                                    setStep(2);
                                } else {
                                    handleSubscribe();
                                }
                            }}
                            disabled={loading}
                            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            {loading ? 'Processando...' : (
                                <>
                                    {step === 2 ? 'Confirmar Assinatura' : 'Continuar'}
                                    <Lock className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
