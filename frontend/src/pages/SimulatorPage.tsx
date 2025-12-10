import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Calendar, Percent, RefreshCw, Car } from 'lucide-react';

export function SimulatorPage() {
    const [vehiclePrice, setVehiclePrice] = useState<string>('');
    const [downPayment, setDownPayment] = useState<string>('');
    const [interestRate, setInterestRate] = useState<string>('1.99');
    const [months, setMonths] = useState<number>(48);
    const [result, setResult] = useState<{
        monthlyPayment: number;
        totalAmount: number;
        totalInterest: number;
        financedAmount: number;
    } | null>(null);

    const calculateFinancing = () => {
        const price = parseFloat(vehiclePrice.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const entry = parseFloat(downPayment.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        const rate = parseFloat(interestRate.replace(',', '.')) / 100;

        if (price <= 0) return;

        const financed = price - entry;

        // Formula Price (Tabela Price)
        // PMT = PV * (i * (1 + i)^n) / ((1 + i)^n - 1)

        let monthly = 0;
        if (rate > 0) {
            monthly = financed * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
        } else {
            monthly = financed / months;
        }

        const total = monthly * months;

        setResult({
            monthlyPayment: monthly,
            totalAmount: total,
            totalInterest: total - financed,
            financedAmount: financed
        });
    };

    // Format currency input
    const formatCurrency = (value: string) => {
        const number = value.replace(/\D/g, '');
        const amount = parseFloat(number) / 100;
        return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') setVehiclePrice('');
        else setVehiclePrice(formatCurrency(value));
    };

    const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') setDownPayment('');
        else setDownPayment(formatCurrency(value));
    };

    useEffect(() => {
        if (vehiclePrice) {
            calculateFinancing();
        } else {
            setResult(null);
        }
    }, [vehiclePrice, downPayment, interestRate, months]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Simulador de Financiamento</h1>
                <p className="text-gray-500 mt-1">Calcule as parcelas e juros para seus clientes em tempo real.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <div className="flex items-center gap-2 mb-6 text-green-700">
                        <Calculator className="w-5 h-5" />
                        <h2 className="font-semibold text-lg">Dados da Simulação</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valor do Veículo
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Car className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    value={vehiclePrice}
                                    onChange={handlePriceChange}
                                    placeholder="R$ 0,00"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valor da Entrada
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <DollarSign className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    value={downPayment}
                                    onChange={handleDownPaymentChange}
                                    placeholder="R$ 0,00"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Taxa (% a.m.)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Percent className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prazo (Meses)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                    <select
                                        value={months}
                                        onChange={(e) => setMonths(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-gray-900 appearance-none bg-white"
                                    >
                                        {[12, 24, 36, 48, 60, 72].map(m => (
                                            <option key={m} value={m}>{m}x</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setVehiclePrice('');
                                setDownPayment('');
                                setInterestRate('1.99');
                                setMonths(48);
                                setResult(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Limpar Simulação
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <p className="text-green-100 font-medium mb-1">Valor da Parcela Mensal</p>
                                        <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
                                            {result.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </h3>
                                        <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
                                            Em {months}x fixas
                                        </span>
                                    </div>
                                    <div className="space-y-4 md:border-l md:border-white/10 md:pl-8">
                                        <div>
                                            <p className="text-green-100 text-sm">Valor Financiado</p>
                                            <p className="text-xl font-bold">{result.financedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-green-100 text-sm">Total a Pagar</p>
                                            <p className="text-xl font-bold">{result.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4">Detalhamento da Simulação</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Valor do Veículo</p>
                                        <p className="font-semibold text-gray-900">{vehiclePrice}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Entrada</p>
                                        <p className="font-semibold text-gray-900">{downPayment || 'R$ 0,00'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Taxa de Juros</p>
                                        <p className="font-semibold text-gray-900">{interestRate}% a.m.</p>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-sm text-red-600 mb-1">Total em Juros</p>
                                        <p className="font-semibold text-red-700">
                                            {result.totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <Calculator className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Realize uma Simulação</h3>
                            <p className="text-gray-500 max-w-sm">
                                Preencha os dados do veículo e do financiamento ao lado para ver o resultado detalhado.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
