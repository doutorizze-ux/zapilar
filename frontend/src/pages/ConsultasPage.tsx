import { ExternalLink, Home, AlertTriangle, FileText, CheckCircle, UserCheck } from 'lucide-react';
import { useState } from 'react';

const REAL_ESTATE_LINKS = [
    { name: 'Matrícula Online (ONR)', url: 'https://registradores.onr.org.br/', description: 'Pesquisa de matrícula e certidões digitais.' },
    { name: 'Certidões Negativas (Justiça)', url: 'https://www.cnj.jus.br/programas-e-acoes/certidao-negativa/', description: 'Consulta de processos e antecedentes.' },
    { name: 'Portal da Transparência', url: 'https://portaldatransparencia.gov.br/', description: 'Consulta de CPF/CNPJ e restrições.' },
    { name: 'Cálculo de ITBI/IPTU', url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/fazenda/servicos/itbi/', description: 'Simulador de impostos municipais.' },
];

export function ConsultasPage() {
    const [selectedLink, setSelectedLink] = useState(0);
    const [valuationQuery, setValuationQuery] = useState({ tipo: '', area: '', bairro: '' });
    const [valuationResult, setValuationResult] = useState<any>(null);
    const [loadingValuation, setLoadingValuation] = useState(false);

    const handleValuationSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingValuation(true);

        // Mocking Valuation Result
        setTimeout(() => {
            const basePrice = 5000; // m2 price
            const area = parseInt(valuationQuery.area) || 50;
            const price = basePrice * area;

            setValuationResult({
                valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price),
                tipo: valuationQuery.tipo || "Apartamento",
                bairro: valuationQuery.bairro || "Centro",
                area: area,
                m2Preco: "R$ 5.000,00",
                mesReferencia: `Janeiro de 2026`,
            });
            setLoadingValuation(false);
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Central de Consultas Imobiliárias</h2>
                <p className="text-gray-500 mt-1">Ferramentas essenciais para análise de imóveis e clientes.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Avaliação de Imóveis (replacing FIPE) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Home className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900">Avaliação de Mercado</h3>
                    </div>

                    <form onSubmit={handleValuationSearch} className="space-y-3 flex-1">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo do Imóvel</label>
                            <select
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                                value={valuationQuery.tipo}
                                onChange={e => setValuationQuery({ ...valuationQuery, tipo: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                <option value="Casa">Casa</option>
                                <option value="Apartamento">Apartamento</option>
                                <option value="Terreno">Terreno</option>
                                <option value="Comercial">SALA Comercial</option>
                                <option value="Sobrado">Sobrado</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Área Útil (m²)</label>
                            <input
                                required
                                type="number"
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                placeholder="Ex: 75"
                                value={valuationQuery.area}
                                onChange={e => setValuationQuery({ ...valuationQuery, area: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Bairro / Localidade</label>
                            <input
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                placeholder="Ex: Jardins"
                                value={valuationQuery.bairro}
                                onChange={e => setValuationQuery({ ...valuationQuery, bairro: e.target.value })}
                            />
                        </div>

                        <button disabled={loadingValuation} type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors mt-2">
                            {loadingValuation ? 'Calculando...' : 'Estimar Valor'}
                        </button>
                    </form>

                    {valuationResult && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up">
                            <p className="text-xs text-blue-600 font-bold uppercase mb-1">Preço Estimado ({valuationResult.area}m²)</p>
                            <p className="text-2xl font-bold text-gray-900">{valuationResult.valor}</p>
                            <p className="text-xs text-gray-500 mt-1">Ref: {valuationResult.mesReferencia}</p>

                            <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between text-xs text-gray-500">
                                <span>Média m²: {valuationResult.m2Preco}</span>
                                <span>{valuationResult.tipo}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Documentação e Cartórios (replacing Detran) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900">Documentação e Links</h3>
                    </div>

                    <div className="flex-1 space-y-4">
                        <p className="text-sm text-gray-500">
                            Acesse portais oficiais para pesquisa de matrículas, certidões negativas e impostos.
                        </p>

                        <div className="space-y-3">
                            <select
                                value={selectedLink}
                                onChange={(e) => setSelectedLink(parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-200 rounded-lg font-bold text-gray-700 text-sm"
                            >
                                {REAL_ESTATE_LINKS.map((link, idx) => (
                                    <option key={idx} value={idx}>{link.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 px-1 uppercase font-bold italic">
                                {REAL_ESTATE_LINKS[selectedLink].description}
                            </p>
                        </div>

                        <a
                            href={REAL_ESTATE_LINKS[selectedLink].url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Acessar Portal
                        </a>
                    </div>
                </div>

                {/* 3. Análise de Crédito (replacing Vistoria) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-green-100 text-green-700 text-xs font-bold rounded-bl-xl border-b border-l border-green-200">
                        Parceiro
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900">Análise de Crédito</h3>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-sm text-gray-500">
                            Verifique a saúde financeira de inquilinos e compradores em segundos.
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Score de Crédito
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Protestos e Dívidas
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Histórico Judicial
                            </div>
                        </div>

                        <button className="w-full py-2 border border-green-600 text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors">
                            Solicitar Análise
                        </button>
                    </div>
                </div>
            </div>

            {/* Alert / Banner */}
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-yellow-800">Atenção sobre Regularização</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                        Sempre verifique a matrícula atualizada do imóvel e as certidões negativas dos proprietários antes de assinar qualquer contrato.
                        O zapilar facilita o acesso aos portais oficiais mas não garante a validade jurídica das consultas externas.
                    </p>
                </div>
            </div>

        </div>
    );
}
