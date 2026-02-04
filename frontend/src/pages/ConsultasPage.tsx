import { ExternalLink, Home, AlertTriangle, FileText, CheckCircle, UserCheck } from 'lucide-react';
import { useState } from 'react';

const REAL_ESTATE_LINKS = [
    { name: 'Matrícula Online (ONR)', url: 'https://registradores.onr.org.br/', description: 'Pesquisa de matrícula e certidões digitais.' },
    { name: 'Certidões Negativas (Justiça)', url: 'https://www.cnj.jus.br/programas-e-acoes/certidao-negativa/', description: 'Consulta de processos e antecedentes.' },
    { name: 'Portal da Transparência', url: 'https://portaldatransparencia.gov.br/', description: 'Consulta de CPF/CNPJ e restrições.' },
    { name: 'Cálculo de ITBI/IPTU', url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/fazenda/servicos/itbi/', description: 'Simulador de impostos municipais.' },
];

const UF_LIST = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const BASE_PRICES: Record<string, number> = {
    'SP': 7500,
    'RJ': 7000,
    'DF': 6800,
    'SC': 6200,
    'PR': 5800,
    'MG': 5500,
    'GO': 4500,
    'RS': 5200,
    'PE': 4800,
    'CE': 4500,
    'BA': 4400,
    'default': 4000
};

const CAPITALS = [
    'SAO PAULO', 'RIO DE JANEIRO', 'BRASILIA', 'CURITIBA', 'FLORIANOPOLIS',
    'BELO HORIZONTE', 'GOIANIA', 'PORTO ALEGRE', 'RECIFE', 'FORTALEZA', 'SALVADOR'
];

export function ConsultasPage() {
    const [selectedLink, setSelectedLink] = useState(0);
    const [valuationQuery, setValuationQuery] = useState({
        tipo: '',
        area: '',
        bairro: '',
        cidade: '',
        uf: '',
        quartos: '2',
        vagas: '1',
        padrao: 'médio'
    });
    const [valuationResult, setValuationResult] = useState<any>(null);
    const [loadingValuation, setLoadingValuation] = useState(false);

    const handleValuationSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingValuation(true);

        // Simulation delay
        setTimeout(() => {
            let basePrice = BASE_PRICES[valuationQuery.uf] || BASE_PRICES['default'];
            const area = parseInt(valuationQuery.area) || 50;
            const cidadeUpper = (valuationQuery.cidade || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            // Adjust for non-capitals
            const isCapital = CAPITALS.some(c => cidadeUpper.includes(c));
            if (!isCapital) basePrice *= 0.75;

            // Scale adjustment
            let scaleMult = 1.0;
            if (area > 200) scaleMult = 0.85;

            // Multipliers
            const typeMultipliers: Record<string, number> = {
                'Apartamento': 1.1,
                'Casa': 1.0,
                'Terreno': 0.4,
                'Lote': 0.35,
                'Chácara': 0.2,
                'Comercial': 1.2,
                'Sobrado': 1.0
            };

            const patternMultipliers: Record<string, number> = {
                'popular': 0.6,
                'médio': 1.0,
                'luxo': 1.5
            };

            const typeMult = typeMultipliers[valuationQuery.tipo] || 1.0;
            const patternMult = patternMultipliers[valuationQuery.padrao] || 1.0;

            const extraBonus = (parseInt(valuationQuery.vagas) * 150) + (parseInt(valuationQuery.quartos) * 100);

            const finalM2Price = (basePrice * typeMult * patternMult * scaleMult) + extraBonus;
            const price = finalM2Price * area;

            setValuationResult({
                valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price),
                tipo: valuationQuery.tipo || "Imóvel",
                bairro: valuationQuery.bairro || "Centro",
                cidade: valuationQuery.cidade || "Cidade",
                area: area,
                m2Preco: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalM2Price),
                mesReferencia: `Fevereiro de 2026`,
                confianca: isCapital ? "Alta (Baseado em capitais)" : "Média (Estimativa para interior)",
            });
            setLoadingValuation(false);
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Central de Consultas Imobiliárias</h2>
                    <p className="text-gray-500 mt-1">Ferramentas de precisão para análise de mercado e documentação.</p>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* 1. Avaliação de Imóveis */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">Avaliação de Mercado</h3>
                            <p className="text-xs text-gray-400">Inteligência de mercado Zapilar</p>
                        </div>
                    </div>

                    <form onSubmit={handleValuationSearch} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tipo do Imóvel</label>
                                <select
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={valuationQuery.tipo}
                                    onChange={e => setValuationQuery({ ...valuationQuery, tipo: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Casa">Casa</option>
                                    <option value="Apartamento">Apartamento</option>
                                    <option value="Terreno">Terreno</option>
                                    <option value="Lote">Lote</option>
                                    <option value="Chácara">Chácara</option>
                                    <option value="Comercial">SALA Comercial</option>
                                    <option value="Sobrado">Sobrado</option>
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Estado (UF)</label>
                                <select
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={valuationQuery.uf}
                                    onChange={e => setValuationQuery({ ...valuationQuery, uf: e.target.value })}
                                >
                                    <option value="">UF</option>
                                    {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Área (m²)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Ex: 75"
                                    value={valuationQuery.area}
                                    onChange={e => setValuationQuery({ ...valuationQuery, area: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Cidade / Município</label>
                                <input
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Ex: São Paulo"
                                    value={valuationQuery.cidade}
                                    onChange={e => setValuationQuery({ ...valuationQuery, cidade: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Bairro</label>
                                <input
                                    required
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Ex: Jardins"
                                    value={valuationQuery.bairro}
                                    onChange={e => setValuationQuery({ ...valuationQuery, bairro: e.target.value })}
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Padrão</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={valuationQuery.padrao}
                                    onChange={e => setValuationQuery({ ...valuationQuery, padrao: e.target.value })}
                                >
                                    <option value="popular">Econômico</option>
                                    <option value="médio">Médio</option>
                                    <option value="luxo">Luxo / Alto</option>
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Quartos</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={valuationQuery.quartos}
                                    onChange={e => setValuationQuery({ ...valuationQuery, quartos: e.target.value })}
                                >
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            disabled={loadingValuation}
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                            {loadingValuation ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Analisando Mercado...</span>
                                </>
                            ) : (
                                <>
                                    <span>Estimar Valor Real</span>
                                    <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {valuationResult && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-fade-in-up relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />

                            <div>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Preço Estimado ({valuationResult.area}m²)</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tight">{valuationResult.valor}</p>
                                <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1.5 font-medium">
                                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                    Ref: {valuationResult.mesReferencia}
                                </p>
                            </div>

                            <div className="mt-5 pt-4 border-t border-blue-200/50 space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500 font-medium">Média m²:</span>
                                    <span className="text-gray-900 font-bold">{valuationResult.m2Preco}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500 font-medium">Localidade:</span>
                                    <span className="text-gray-900 font-bold truncate max-w-[150px]">{valuationResult.bairro}, {valuationResult.cidade}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500 font-medium">Confiança:</span>
                                    <span className="text-green-600 font-bold">{valuationResult.confianca}</span>
                                </div>
                            </div>

                            <button className="w-full mt-4 py-2 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors">
                                Exportar Relatório Detalhado
                            </button>
                        </div>
                    )}
                </div>


                {/* 2. Documentação e Cartórios */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col group hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">Documentação e Links</h3>
                            <p className="text-xs text-gray-400">Acesso a portais governamentais</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Consulte matrículas, certidões negativas e impostos municipais instantaneamente.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Selecione o Serviço</label>
                                <select
                                    value={selectedLink}
                                    onChange={(e) => setSelectedLink(parseInt(e.target.value))}
                                    className="w-full p-3 border border-gray-200 rounded-xl font-bold text-gray-700 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                                >
                                    {REAL_ESTATE_LINKS.map((link, idx) => (
                                        <option key={idx} value={idx}>{link.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100/50">
                                <p className="text-xs text-orange-800 font-medium italic">
                                    {REAL_ESTATE_LINKS[selectedLink].description}
                                </p>
                            </div>
                        </div>

                        <a
                            href={REAL_ESTATE_LINKS[selectedLink].url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Acessar Portal Oficial
                        </a>
                    </div>
                </div>

                {/* 3. Análise de Crédito */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:border-green-200 transition-colors">
                    <div className="absolute top-0 right-0 p-2 px-3 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-bl-xl border-b border-l border-green-200 tracking-wider">
                        Parceiro
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 leading-tight">Análise de Crédito</h3>
                            <p className="text-xs text-gray-400">Score e CPF/CNPJ</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-6">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Garanta segurança jurídica nas locações e vendas com análise em tempo real.
                        </p>

                        <div className="space-y-3 p-4 bg-green-50/30 rounded-2xl border border-green-100/50">
                            <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                                <div className="p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                Score de Crédito Detalhado
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                                <div className="p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                Protestos e Dívidas Ativas
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                                <div className="p-1 bg-green-100 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                Histórico Judicial Completo
                            </div>
                        </div>

                        <button className="w-full py-3 border-2 border-green-600 text-green-700 font-bold rounded-xl hover:bg-green-600 hover:text-white transition-all active:scale-[0.98]">
                            Solicitar Análise de CPF/CNPJ
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
