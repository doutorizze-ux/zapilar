
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
                        if (data.latestPaymentStatus === 'RECEIVED' || data.latestPaymentStatus === 'CONFIRMED') {
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
                // Se for PIX e tiver QR Code, mostra no modal (Prioridade)
                if (billingType === 'PIX' && (data.pixQrCode || data.pixCode)) {
                    setPixCode(data.pixQrCode?.payload || data.pixCode);
                    setPixImage(data.pixQrCode?.encodedImage);
                    setStep(3);
                    return;
                }

                // Se não for PIX (ou falhar QR Code), mas tiver URL, redireciona (ex: Boleto)
                if (data.paymentUrl && billingType !== 'CREDIT_CARD') {
                    window.location.href = data.paymentUrl;
                    return;
                }

                // Sucesso genérico (Cartão)
                // alert('Assinatura realizada!'); 
                onSuccess();
                onClose();

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
                        <div className="space-y-6">
                            {billingType === 'CREDIT_CARD' && (
                                <div>
                                    {/* Visual Card */}
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white mb-6 shadow-xl relative overflow-hidden transition-all hover:scale-[1.02]">
                                        <div className="absolute -right-6 -top-6 text-white opacity-10 rotate-12">
                                            <CreditCard className="w-48 h-48" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="w-12 h-9 bg-gradient-to-tr from-yellow-300 to-yellow-600 rounded-md shadow-sm border border-yellow-400/50 flex items-center justify-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-black/10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                                                </div>
                                                <span className="font-mono text-xs opacity-50 tracking-widest uppercase">Crédito</span>
                                            </div>

                                            <div className="font-mono text-2xl tracking-[0.15em] mb-6 drop-shadow-md min-h-[32px]">
                                                {cardData.number ? cardData.number.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div className="flex-1 mr-4 overflow-hidden">
                                                    <div className="text-[9px] opacity-60 uppercase tracking-widest mb-1">Nome do Titular</div>
                                                    <div className="font-medium tracking-wider uppercase truncate drop-shadow-sm font-mono text-sm">
                                                        {cardData.holderName || 'SEU NOME AQUI'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[9px] opacity-60 uppercase tracking-widest mb-1">Validade</div>
                                                    <div className="font-mono text-sm tracking-wider">
                                                        {cardData.expiryMonth || 'MM'}/{cardData.expiryYear?.slice(-2) || 'YY'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">Número do Cartão</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    placeholder="0000 0000 0000 0000"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 font-mono text-gray-700 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                                                    value={cardData.number}
                                                    onChange={e => setCardData({ ...cardData, number: e.target.value })}
                                                    maxLength={19}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">Nome do Titular</label>
                                            <input
                                                placeholder="Como está impresso no cartão"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium text-gray-700 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none uppercase"
                                                value={cardData.holderName}
                                                onChange={e => setCardData({ ...cardData, holderName: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">Mês</label>
                                                <input
                                                    placeholder="MM"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-center text-gray-700 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                                                    value={cardData.expiryMonth}
                                                    onChange={e => setCardData({ ...cardData, expiryMonth: e.target.value })}
                                                    maxLength={2}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">Ano</label>
                                                <input
                                                    placeholder="AAAA"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-center text-gray-700 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                                                    value={cardData.expiryYear}
                                                    onChange={e => setCardData({ ...cardData, expiryYear: e.target.value })}
                                                    maxLength={4}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 ml-1">CVV</label>
                                                <input
                                                    placeholder="123"
                                                    type="password"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-center text-gray-700 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                                                    value={cardData.ccv}
                                                    onChange={e => setCardData({ ...cardData, ccv: e.target.value })}
                                                    maxLength={4}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b pb-2 mb-4">
                                    <div className="w-1 h-4 bg-gray-900 rounded-full" />
                                    Dados de Cobrança
                                </h3>
                                <div className="space-y-3">
                                    <input placeholder="Nome Completo" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" value={holderInfo.name} onChange={e => setHolderInfo({ ...holderInfo, name: e.target.value })} />
                                    <input placeholder="CPF/CNPJ" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" value={holderInfo.cpfCnpj} onChange={e => setHolderInfo({ ...holderInfo, cpfCnpj: e.target.value })} />
                                    <div className="flex gap-3">
                                        <input placeholder="CEP" className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" value={holderInfo.postalCode} onChange={e => setHolderInfo({ ...holderInfo, postalCode: e.target.value })} />
                                        <input placeholder="Número" className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" value={holderInfo.addressNumber} onChange={e => setHolderInfo({ ...holderInfo, addressNumber: e.target.value })} />
                                    </div>
                                    <input placeholder="Telefone" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all" value={holderInfo.phone} onChange={e => setHolderInfo({ ...holderInfo, phone: e.target.value })} />
                                </div>
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
                                    className="text-green-600 font-bold text-xs whitespace-nowrap hover:underline"
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
