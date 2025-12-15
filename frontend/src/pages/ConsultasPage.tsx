import { Search, ExternalLink, ShieldCheck, Car, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const DETRAN_LINKS = {
    'SP': 'https://www.detran.sp.gov.br/wps/portal/portaldetran/cidadao/veiculos/servicos/pesquisaDebitosRestricoesVeiculos',
    'RJ': 'https://www.detran.rj.gov.br/_documento.asp?cod=140',
    'MG': 'https://www.detran.mg.gov.br/veiculos/situacao-do-veiculo/consultar-situacao-do-veiculo',
    'PR': 'https://www.git.parana.pr.gov.br/#/servicos/consultar-debitos-veiculo',
    'SC': 'https://consultas.detrannet.sc.gov.br/servicos/consultaveiculo.asp',
    'RS': 'https://www.detran.rs.gov.br/consulta-veiculo',
    'GO': 'https://www.detran.go.gov.br/psw/#/pages/pagina-inicial',
    'DF': 'https://portal.detran.df.gov.br/',
    'BA': 'https://www.detran.ba.gov.br/',
    // Add more as needed
};

export function ConsultasPage() {
    const [selectedState, setSelectedState] = useState('SP');
    const [fipeQuery, setFipeQuery] = useState({ marca: '', modelo: '', ano: '' });
    const [fipeResult, setFipeResult] = useState<any>(null);
    const [loadingFipe, setLoadingFipe] = useState(false);

    const handleFipeSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingFipe(true);

        // Mocking FIPE Result with realistic variation based on Year
        setTimeout(() => {
            const basePrice = 150000;
            const year = parseInt(fipeQuery.ano) || 2024;
            const diff = 2025 - year;
            const price = basePrice - (diff * 12000);

            setFipeResult({
                valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price),
                marca: fipeQuery.marca || "Toyota",
                modelo: fipeQuery.modelo || "Corolla XEi",
                anoModelo: year,
                combustivel: "Flex",
                codigoFipe: `00${Math.floor(Math.random() * 9000)}-${Math.floor(Math.random() * 9)}`,
                mesReferencia: `Dezembro de 2025`,
                historico: []
            });
            setLoadingFipe(false);
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Consultas & Detran</h2>
                <p className="text-gray-500 mt-1">Central de inteligência veicular e regularização.</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Consulta FIPE Inteligente */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900">Consulta FIPE</h3>
                    </div>

                    <form onSubmit={handleFipeSearch} className="space-y-3 flex-1">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Marca</label>
                            <select
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                                value={fipeQuery.marca}
                                onChange={e => setFipeQuery({ ...fipeQuery, marca: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                <option value="Toyota">Toyota</option>
                                <option value="Honda">Honda</option>
                                <option value="Volkswagen">Volkswagen</option>
                                <option value="Chevrolet">Chevrolet</option>
                                <option value="Fiat">Fiat</option>
                                <option value="Ford">Ford</option>
                                <option value="Hyundai">Hyundai</option>
                                <option value="Jeep">Jeep</option>
                                <option value="Nissan">Nissan</option>
                                <option value="Renault">Renault</option>
                                <option value="BMW">BMW</option>
                                <option value="Mercedes-Benz">Mercedes-Benz</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Modelo</label>
                            <input
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                placeholder="Ex: Corolla XEi 2.0"
                                value={fipeQuery.modelo}
                                onChange={e => setFipeQuery({ ...fipeQuery, modelo: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ano Modelo</label>
                            <select
                                required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white"
                                value={fipeQuery.ano}
                                onChange={e => setFipeQuery({ ...fipeQuery, ano: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {Array.from({ length: 17 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button disabled={loadingFipe} type="submit" className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors mt-2">
                            {loadingFipe ? 'Consultando...' : 'Consultar Valor'}
                        </button>
                    </form>

                    {fipeResult && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 animate-fade-in-up">
                            <p className="text-xs text-purple-600 font-bold uppercase mb-1">Preço Médio ({fipeResult.anoModelo})</p>
                            <p className="text-2xl font-bold text-gray-900">{fipeResult.valor}</p>
                            <p className="text-xs text-gray-500 mt-1">Ref: {fipeResult.mesReferencia}</p>

                            <div className="mt-3 pt-3 border-t border-purple-100 flex justify-between text-xs text-gray-500">
                                <span>Cód. Fipe: {fipeResult.codigoFipe}</span>
                                <span>{fipeResult.combustivel}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Hub de Débitos (Detran) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <Car className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900">Consulta de Débitos</h3>
                    </div>

                    <div className="flex-1 space-y-4">
                        <p className="text-sm text-gray-500">
                            Acesse o sistema oficial do Detran do seu estado para consultar Multas, IPVA e Licenciamento.
                        </p>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Selecione o Estado</label>
                            <select
                                value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg font-bold text-gray-700"
                            >
                                {Object.keys(DETRAN_LINKS).map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </div>

                        <a
                            href={(DETRAN_LINKS as any)[selectedState]}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Acessar Detran {selectedState}
                        </a>
                    </div>
                </div>

                {/* 3. Vistoria Cautelar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-bl-xl border-b border-l border-yellow-200">
                        Parceiro
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900">Vistoria Cautelar</h3>
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-sm text-gray-500">
                            Garanta a procedência do veículo antes de comprar. Solicite desconto para lojistas Zapicar.
                        </p>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Análise Estrutural
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Histórico de Leilão
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" /> Identificação de Motor
                            </div>
                        </div>

                        <button className="w-full py-2 border border-green-600 text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors">
                            Solicitar Vistoria
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
                        Sempre verifique a existência de gravame ou restrições judiciais (RENAJUD) antes de fechar negócio.
                        O Zapicar apenas facilita o acesso aos links oficiais e não se responsabiliza pelas informações dos órgãos públicos.
                    </p>
                </div>
            </div>

        </div>
    );
}
