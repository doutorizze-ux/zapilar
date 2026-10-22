import { useState } from 'react';
import { X, Upload, Link, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

interface ImportPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportPropertiesModal({ isOpen, onClose, onSuccess }: ImportPropertiesModalProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [feedUrl, setFeedUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    setLoading(true);
    setResultMessage(null);
    setErrorMessage(null);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/properties/import-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: feedUrl.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setResultMessage(data.message || `${data.total} imóveis importados com sucesso!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2500);
      } else {
        setErrorMessage(data.message || 'Erro ao importar feed XML. Verifique o link.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResultMessage(null);
    setErrorMessage(null);

    const token = localStorage.getItem('token');
    try {
      const text = await file.text();
      const isXml = file.name.endsWith('.xml') || text.trim().startsWith('<');
      const endpoint = isXml ? `${API_URL}/properties/import-xml` : `${API_URL}/properties/import-csv`;
      const body = isXml ? { xml: text } : { csv: text };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setResultMessage(data.message || `${data.total} imóveis importados com sucesso!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2500);
      } else {
        setErrorMessage(data.message || 'Erro ao processar o arquivo.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao ler arquivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Importação em Massa</h3>
              <p className="text-xs text-gray-500">Sincronize seu catálogo sem digitar na mão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-6">
          <button
            onClick={() => setActiveTab('url')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'url'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link className="w-4 h-4" /> Link do Feed XML (ZAP / Kenlo)
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Arquivo XML ou CSV
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {resultMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Importação Concluída!</p>
                <p className="text-xs mt-0.5">{resultMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ops! Ocorreu um erro</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {activeTab === 'url' ? (
            <form onSubmit={handleImportUrl} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  URL do Feed XML (Padrão VivaReal / ZAP)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://seu-crm.com.br/integracao/vivareal.xml"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Compatível com <strong>Kenlo (InGaia), Vista Soft, Universal Software, Tecimob, Sigavi</strong> e portais <strong>ZAP / VivaReal</strong>. O robô vai baixar fotos, descrições, bairros e valores automaticamente.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Importando Imóveis...
                    </>
                  ) : (
                    'Sincronizar Estoque Agora'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleImportFile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selecione o arquivo (.xml ou .csv)
                </label>
                <div className="border-2 border-dashed border-gray-200 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50">
                  <input
                    type="file"
                    accept=".xml,.csv,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="import-file-input"
                  />
                  <label htmlFor="import-file-input" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">
                      {file ? file.name : 'Clique para escolher o arquivo'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">XML de Portais ou Planilha CSV de Loteamentos</p>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processando Arquivo...
                    </>
                  ) : (
                    'Importar Arquivo'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
