import { X } from "lucide-react";

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up">

                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Termos de Uso, Segurança e Privacidade</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700 text-sm leading-relaxed">

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">1. Aceitação dos Termos</h3>
                        <p>Ao utilizar a plataforma zapilar, o usuário declara que leu, entendeu e concorda integralmente com estes Termos de Uso, Segurança e Privacidade. Caso não concorde, o uso da plataforma deve ser interrompido imediatamente.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">2. Sobre a Plataforma</h3>
                        <p>A zapilar é uma plataforma SaaS que fornece ferramentas de automação de atendimento via WhatsApp, permitindo que lojistas divulguem informações de seus veículos e respondam automaticamente a mensagens de clientes interessados. A plataforma não realiza vendas, não intermedia pagamentos, não participa de negociações e não garante qualquer transação comercial realizada entre lojistas e compradores.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">3. Responsabilidade dos Lojistas</h3>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Veracidade das informações dos veículos cadastrados;</li>
                            <li>Preços, condições, imagens e descrições;</li>
                            <li>Atendimento prestado ao cliente;</li>
                            <li>Cumprimento de acordos comerciais;</li>
                            <li>Entrega de veículos e documentação;</li>
                            <li>Cumprimento da legislação vigente.</li>
                        </ul>
                        <p className="mt-2">A zapilar não se responsabiliza por fraudes, golpes, atrasos, desistências, problemas mecânicos ou qualquer prejuízo decorrente da negociação entre lojista e comprador.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">4. Responsabilidade dos Compradores</h3>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>A negociação ocorre diretamente com o lojista;</li>
                            <li>Devem verificar pessoalmente o veículo antes de qualquer pagamento;</li>
                            <li>Devem desconfiar de ofertas fora do padrão de mercado;</li>
                            <li>A zapilar não solicita pagamentos em nome de lojistas;</li>
                            <li>Qualquer pagamento feito sem a devida verificação é de responsabilidade exclusiva do comprador.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">5. Uso do WhatsApp</h3>
                        <p>A plataforma utiliza integração com WhatsApp Web para automatizar atendimentos. O usuário declara estar ciente de que:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>O WhatsApp é um serviço de terceiros;</li>
                            <li>Eventuais bloqueios, instabilidades ou limitações são de responsabilidade do WhatsApp;</li>
                            <li>A zapilar não possui vínculo oficial com o WhatsApp ou Meta.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">6. Proibições de Uso</h3>
                        <p>É expressamente proibido utilizar a plataforma para:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Disparo de mensagens em massa;</li>
                            <li>Envio de spam;</li>
                            <li>Atividades ilegais ou fraudulentas;</li>
                            <li>Venda de produtos ilícitos;</li>
                            <li>Práticas que violem os Termos do WhatsApp.</li>
                        </ul>
                        <p className="mt-2 text-red-600 font-medium">O descumprimento pode resultar em suspensão ou cancelamento da conta, sem direito a reembolso.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">7. Limitação de Responsabilidade</h3>
                        <p>Em nenhuma hipótese a zapilar será responsável por danos diretos ou indiretos, perda financeira, golpes praticados por terceiros ou problemas decorrentes de negociações mal-sucedidas. O uso da plataforma é feito por conta e risco do usuário.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">8. Privacidade e Proteção de Dados (LGPD)</h3>
                        <p>A zapilar respeita a Lei Geral de Proteção de Dados (LGPD).</p>
                        <div className="mt-2">
                            <strong>Dados coletados:</strong> Nome, telefone e mensagens trocadas no WhatsApp, informações cadastrais do lojista, dados técnicos para funcionamento da plataforma.
                        </div>
                        <div className="mt-2">
                            <strong>Uso dos dados:</strong> Exclusivamente para funcionamento do sistema, atendimento ao cliente, segurança e melhoria da plataforma.
                        </div>
                        <p className="mt-2 font-bold text-cyan-700">❌ Nunca vendemos ou compartilhamos dados pessoais com terceiros, exceto quando exigido por lei.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">9. Segurança da Informação</h3>
                        <p>Adotamos medidas técnicas e organizacionais para proteger os dados armazenados, porém nenhum sistema é 100% inviolável. O usuário reconhece e aceita os riscos inerentes ao uso de plataformas digitais.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-gray-900 mb-2">10. Cancelamento e Suspensão</h3>
                        <p>A zapilar reserva-se o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio, visando a segurança da plataforma e dos usuários.</p>
                    </section>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors">
                        Entendi e Concordo
                    </button>
                </div>
            </div>
        </div>
    );
}
