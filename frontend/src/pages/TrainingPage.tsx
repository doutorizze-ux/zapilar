import { Trash2, Plus, MessageSquare, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';

interface Faq {
    id: string;
    question: string;
    answer: string;
    active: boolean;
}

export function TrainingPage() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFaqs = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_URL}/faqs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setFaqs(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion || !newAnswer) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/faqs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question: newQuestion, answer: newAnswer })
            });

            if (res.ok) {
                setNewQuestion('');
                setNewAnswer('');
                fetchFaqs();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta resposta?')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/faqs/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFaqs(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const text = await file.text();
            const lines = text.split('\n');
            let count = 0;

            setLoading(true);

            // Simple loop import (can be optimized with bulk endpoint later)
            for (const line of lines) {
                // Support semicolon or comma if not quoted
                // Simple split by ; preferred
                const parts = line.split(';');
                if (parts.length >= 2) {
                    const q = parts[0].trim();
                    const a = parts.slice(1).join(';').trim(); // Join rest in case answer has semicolons

                    if (q && a) {
                        await fetch(`${API_URL}/faqs`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ question: q, answer: a })
                        });
                        count++;
                    }
                }
            }
            alert(`Importação concluída! ${count} perguntas adicionadas.`);
            fetchFaqs();
        } catch (error) {
            console.error(error);
            alert('Erro ao importar arquivo.');
            setLoading(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Treinamento do Chatbot</h2>
                    <p className="text-gray-500 mt-1">Ensine o bot a responder perguntas frequentes automaticamente.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        Importar CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        Nova Resposta
                    </h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Se o cliente disser...</label>
                            <input
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                placeholder="ex: qual o endereço, onde fica"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">Palavras-chave separadas por vírgula ou frase.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">O bot deve responder...</label>
                            <textarea
                                value={newAnswer}
                                onChange={e => setNewAnswer(e.target.value)}
                                rows={4}
                                placeholder="ex: Estamos na Rua das Flores, 123..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <button type="submit" disabled={!newQuestion || !newAnswer} className="w-full py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                            Adicionar Regra
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-500">
                        <h4 className="font-semibold text-gray-700 mb-2">Formato para Importação:</h4>
                        <p>Crie um arquivo texto ou CSV com cada linha no formato:</p>
                        <code className="block bg-white p-2 mt-2 rounded border border-gray-200 text-xs">
                            pergunta;resposta<br />
                            outra pergunta;outra resposta
                        </code>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Carregando...</div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Nenhuma regra criada ainda.</p>
                        </div>
                    ) : (
                        faqs.map(faq => (
                            <div key={faq.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <span className="text-blue-600 text-sm bg-blue-50 px-2 py-0.5 rounded-md">Gatilho:</span>
                                        {faq.question}
                                    </h4>
                                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg mt-2 border border-blue-100/30">
                                        {faq.answer}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(faq.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
