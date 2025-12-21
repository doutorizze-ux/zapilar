import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit2, Phone, Mail } from 'lucide-react';

export function ContactsPage() {
    const { token } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/contacts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setContacts(await res.json());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingContact
            ? `${import.meta.env.VITE_API_URL}/contacts/${editingContact.id}`
            : `${import.meta.env.VITE_API_URL}/contacts`;

        const method = editingContact ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            setEditingContact(null);
            setFormData({ name: '', phone: '', email: '', notes: '' });
            fetchContacts();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        await fetch(`${import.meta.env.VITE_API_URL}/contacts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchContacts();
    };

    const openModal = (contact: any = null) => {
        setEditingContact(contact);
        setFormData(contact || { name: '', phone: '', email: '', notes: '' });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Contatos Pessoais</h1>
                <button onClick={() => openModal()} className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700">
                    <Plus className="w-4 h-4" /> Novo Contato
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contacts.map((contact: any) => (
                    <div key={contact.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-gray-900">{contact.name}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => openModal(contact)} className="p-1 px-2 text-cyan-600 hover:bg-cyan-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(contact.id)} className="p-1 px-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm text-gray-600">
                            {contact.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-cyan-600" /> {contact.phone}</div>}
                            {contact.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> {contact.email}</div>}
                            {contact.notes && <p className="mt-4 pt-4 border-t border-gray-100 text-gray-500 italic text-xs">{contact.notes}</p>}
                        </div>
                    </div>
                ))}
                {contacts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        Nenhum contato cadastrado.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingContact ? 'Editar' : 'Novo'} Contato</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input placeholder="Nome do contato" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <input placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea placeholder="Observações..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg h-24" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
