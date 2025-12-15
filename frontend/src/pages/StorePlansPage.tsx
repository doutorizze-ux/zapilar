
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
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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

                if (data.status === 'ACTIVE' || data.latestPaymentStatus === 'RECEIVED' || data.latestPaymentStatus === 'CONFIRMED' || data.latestPaymentStatus === 'COMPLETED') {
                    if (window.location.hash.includes('checkout')) {
                        window.location.href = '/dashboard';
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }
    };

    const onSubscribeSuccess = () => {
        fetchSubscription();
        // Force redirect to dashboard home just to be safe and give feedback
        setTimeout(() => window.location.href = '/dashboard', 1000);
    };

    if (loading) return <div>Carregando...</div>;

    // Group plans by name
    const groupedPlans = plans.reduce((acc, plan) => {
        const key = plan.name.trim();
        if (!acc[key]) acc[key] = [];
        acc[key].push(plan);
        return acc;
    }, {} as Record<string, Plan[]>);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Planos e Assinaturas</h1>
                <p className="text-gray-500">Escolha o melhor plano para sua loja</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
                {Object.keys(groupedPlans).map(planName => (
                    <PlanCardGroup
                        key={planName}
                        variants={groupedPlans[planName]}
                        currentSubscription={currentSubscription}
                        onSubscribe={setSelectedPlan}
                    />
                ))}
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

function PlanCardGroup({ variants, currentSubscription, onSubscribe }: { variants: Plan[], currentSubscription: any, onSubscribe: (p: Plan) => void }) {
    // Determine default interval: prioritize Monthly if available, else first one
    const defaultVariant = variants.find(v => v.interval === 'MONTHLY') || variants[0];
    const [selectedInterval, setSelectedInterval] = useState(defaultVariant.interval);

    const activePlan = variants.find(v => v.interval === selectedInterval) || variants[0];

    // Check if THIS specific variant is the user's current plan
    const isCurrent = currentSubscription?.planId === activePlan.id;
    const isPaid = currentSubscription?.latestPaymentStatus === 'RECEIVED' || currentSubscription?.latestPaymentStatus === 'CONFIRMED' || currentSubscription?.latestPaymentStatus === 'COMPLETED';
    const isPending = isCurrent && !isPaid;

    const intervalLabels: Record<string, string> = {
        'MONTHLY': 'Mensal',
        'QUARTERLY': 'Trimestral',
        'SEMIANNUALLY': 'Semestral',
        'YEARLY': 'Anual'
    };

    return (
        <div className={`w-full max-w-sm bg-white rounded-2xl p-8 border transition-all ${isCurrent ? (isPending ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-green-500 ring-2 ring-green-100') : 'border-gray-200 hover:border-gray-300'} shadow-sm flex flex-col relative`}>
            {isCurrent && (
                <div className={`absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl ${isPending ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {isPending ? 'AGUARDANDO PAGAMENTO' : 'ATUAL'}
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{activePlan.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{activePlan.description || 'Plano completo para sua loja'}</p>
            </div>

            {/* Interval Selector */}
            {variants.length > 1 && (
                <div className="flex p-1 bg-gray-100 rounded-lg mb-6 self-start">
                    {variants.sort((a, b) => (a.price - b.price)).map(variant => (
                        <button
                            key={variant.id}
                            onClick={() => setSelectedInterval(variant.interval)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${selectedInterval === variant.interval ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {intervalLabels[variant.interval] || variant.interval}
                        </button>
                    ))}
                </div>
            )}

            <div className="mb-4">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    7 Dias Grátis no Cartão
                </span>
            </div>

            <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">R$ {activePlan.price.toFixed(2).replace('.', ',')}</span>
                <span className="text-gray-500">/{intervalLabels[activePlan.interval]?.toLowerCase() || activePlan.interval}</span>
            </div>

            <div className="space-y-4 flex-1 mb-8">
                {(Array.isArray(activePlan.features) ? activePlan.features : []).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        {feature}
                    </div>
                ))}
            </div>

            <button
                onClick={() => onSubscribe(activePlan)}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800 transform hover:-translate-y-0.5 shadow-lg shadow-gray-200'
                    }`}
                disabled={isCurrent}
            >
                {isCurrent ? 'Plano Atual' : 'Escolher este Plano'}
            </button>
        </div>
    );
}
