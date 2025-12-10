import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Check } from 'lucide-react';
import { SubscribeModal } from '../components/SubscribeModal';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
}

export function StorePlansPage() {
    const { token } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);

    useEffect(() => {
        if (currentSubscription && currentSubscription.status !== 'ACTIVE') {
            const interval = setInterval(fetchSubscription, 5000);
            return () => clearInterval(interval);
        }
    }, [currentSubscription]);

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchPlans(), fetchSubscription()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/plans`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const fetchSubscription = async () => {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/my-subscription?t=${timestamp}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentSubscription(data);

                // Reload if status is active to unlock dashboard in layout check
                if (data.status === 'ACTIVE' || data.latestPaymentStatus === 'RECEIVED' || data.latestPaymentStatus === 'CONFIRMED') {
                    // Just update state, let the user navigate manually or layout handle it
                }
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }
    };

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const handleSubscribe = (plan: Plan) => {
        setSelectedPlan(plan);
    };

    const onSubscribeSuccess = () => {
        fetchSubscription();
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Planos e Assinaturas</h1>
                <p className="text-gray-500">Escolha o melhor plano para sua loja</p>

            </div>

            <div className="flex flex-wrap justify-center gap-8">
                {plans.map(plan => {
                    const isCurrent = currentSubscription?.planId === plan.id;
                    const isPaid = currentSubscription?.latestPaymentStatus === 'RECEIVED' || currentSubscription?.latestPaymentStatus === 'CONFIRMED';
                    // Show pending if current plan but payment is not settled
                    const isPending = isCurrent && !isPaid;

                    return (
                        <div key={plan.id} className={`w-full max-w-sm bg-white rounded-2xl p-8 border ${isCurrent ? (isPending ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-green-500 ring-2 ring-green-100') : 'border-gray-200'} shadow-sm flex flex-col relative`}>
                            {isCurrent && (
                                <div className={`absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl ${isPending ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                    {isPending ? 'AGUARDANDO PAGAMENTO' : 'ATUAL'}
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                                <span className="text-gray-500">/{plan.interval === 'MONTHLY' ? 'mês' : plan.interval}</span>
                            </div>

                            <div className="space-y-4 flex-1 mb-8">
                                {(plan.features || []).map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                        <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-2.5 h-2.5 text-green-600" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan)}
                                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${isCurrent
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}
                                disabled={isCurrent}
                            >
                                {isCurrent ? 'Plano Atual' : 'Assinar Agora'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {selectedPlan && (
                <SubscribeModal
                    plan={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    onSuccess={onSubscribeSuccess}
                />
            )}
        </div>
    );
}
