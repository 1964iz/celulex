import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Receipt,
  FileText,
} from 'lucide-react';
import { Client } from '../types';
import { validateCPF, formatCPF, formatPhone, formatCurrency, formatDateTime } from '../utils/formatters';

interface ClientsViewProps {
  clients: Client[];
  onRefresh: () => void;
  onCreateClient: (data: Partial<Client>) => Promise<boolean>;
  onUpdateClient: (id: number, data: Partial<Client>) => Promise<boolean>;
  onDeleteClient: (id: number) => Promise<boolean>;
  onSelectSaleForReceipt: (saleId: number) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onRefresh,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onSelectSaleForReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<Client | null>(null);
  const [clientDetailsSales, setClientDetailsSales] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    state: 'SP',
    country: 'Brasil',
    notes: '',
  });

  const [cpfValidationStatus, setCpfValidationStatus] = useState<{
    isValid: boolean;
    touched: boolean;
  }>({ isValid: false, touched: false });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.cpf.includes(term) ||
      c.whatsapp.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      cpf: '',
      email: '',
      whatsapp: '',
      address: '',
      city: '',
      state: 'SP',
      country: 'Brasil',
      notes: '',
    });
    setCpfValidationStatus({ isValid: false, touched: false });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      cpf: formatCPF(client.cpf),
      email: client.email,
      whatsapp: formatPhone(client.whatsapp),
      address: client.address,
      city: client.city,
      state: client.state,
      country: client.country || 'Brasil',
      notes: client.notes || '',
    });
    setCpfValidationStatus({ isValid: true, touched: true });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCpfChange = (raw: string) => {
    const formatted = formatCPF(raw);
    const clean = raw.replace(/\D/g, '');
    const valid = validateCPF(clean);
    setFormData((prev) => ({ ...prev, cpf: formatted }));
    setCpfValidationStatus({
      isValid: valid,
      touched: clean.length > 0,
    });
  };

  const handlePhoneChange = (raw: string) => {
    setFormData((prev) => ({ ...prev, whatsapp: formatPhone(raw) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCpf = formData.cpf.replace(/\D/g, '');
    if (!validateCPF(cleanCpf)) {
      setFormError('CPF inválido! O algoritmo de dígitos verificadores rejeitou este número.');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('O nome completo é obrigatório.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }

    if (!formData.whatsapp.trim()) {
      setFormError('O WhatsApp é obrigatório.');
      return;
    }

    if (!formData.address.trim()) {
      setFormError('O endereço completo é obrigatório.');
      return;
    }

    if (!formData.city.trim()) {
      setFormError('A cidade é obrigatória.');
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<Client> = {
      name: formData.name.trim(),
      cpf: cleanCpf,
      email: formData.email.trim(),
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      country: formData.country.trim() || 'Brasil',
      notes: formData.notes.trim(),
    };

    let success = false;
    if (editingClient) {
      success = await onUpdateClient(editingClient.id, payload);
    } else {
      success = await onCreateClient(payload);
    }

    setIsSubmitting(false);

    if (success) {
      setIsModalOpen(false);
      setEditingClient(null);
    }
  };

  const openClientDetails = async (client: Client) => {
    setSelectedClientForDetails(client);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`);
      if (res.ok) {
        const data = await res.json();
        setClientDetailsSales(data.sales || []);
      }
    } catch (err) {
      console.error('Error fetching client details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Clientes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro completo com validação de CPF, dados para contato e histórico de recibos.
          </p>
        </div>

        <button
          id="btn-add-client"
          onClick={openNewClientModal}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar cliente por nome, CPF, WhatsApp ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          {filteredClients.length} cadastrados
        </span>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhum cliente corresponde ao termo pesquisado.'
              : 'Cadastre seus clientes com CPF validado para vincular às vendas e emitir recibos.'}
          </p>
          <button
            onClick={openNewClientModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Cadastrar Primeiro Cliente
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Nome / Contato</th>
                  <th className="py-3.5 px-4">CPF</th>
                  <th className="py-3.5 px-4">Localidade</th>
                  <th className="py-3.5 px-4">Total em Compras</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {formatPhone(client.whatsapp)}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {client.email}
                        </span>
                      </div>
                    </td>

                    {/* CPF */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-medium">
                        {formatCPF(client.cpf)}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {client.city} - {client.state}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">
                        {client.address}
                      </div>
                    </td>

                    {/* Purchases & Spent */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(client.total_spent || 0)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {client.total_purchases || 0} venda(s) registrada(s)
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openClientDetails(client)}
                          title="Ver histórico e recibos do cliente"
                          className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          Histórico
                        </button>

                        <button
                          onClick={() => openEditClientModal(client)}
                          title="Editar cadastro do cliente"
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente remover o cliente ${client.name}?`)) {
                              onDeleteClient(client.id);
                            }
                          }}
                          title="Excluir cliente"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CADASTRAR / EDITAR CLIENTE (COM VALIDAÇÃO DE CPF)
         ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva Santos"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* CPF com Validação em Tempo Real */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    CPF (com validação oficial) *
                  </label>
                  {cpfValidationStatus.touched && (
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 ${
                        cpfValidationStatus.isValid ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {cpfValidationStatus.isValid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> CPF Válido
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> CPF Inválido
                        </>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={formData.cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none transition-all ${
                    cpfValidationStatus.touched
                      ? cpfValidationStatus.isValid
                        ? 'border-emerald-400 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-400'
                        : 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Cálculo automático de dígitos verificadores (apenas números válidos permitidos).
                </span>
              </div>

              {/* Contatos: E-mail e WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cliente@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    value={formData.whatsapp}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Endereço Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo (Rua, Número, Bairro, Complemento) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua das Flores, 120, Apto 32 - Jardim Paulista"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Cidade, Estado e País */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="SP"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm uppercase text-center font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações relevantes sobre preferências, recomendações, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !cpfValidationStatus.isValid}
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-xs ${
                    cpfValidationStatus.isValid
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : editingClient
                    ? 'Salvar Alterações'
                    : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: DETALHES DO CLIENTE & HISTÓRICO DE RECIBOS
         ========================================================= */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {selectedClientForDetails.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedClientForDetails.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    CPF: {formatCPF(selectedClientForDetails.cpf)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Info Card */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-800">
                  {formatPhone(selectedClientForDetails.whatsapp)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedClientForDetails.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {selectedClientForDetails.address} - {selectedClientForDetails.city} /{' '}
                  {selectedClientForDetails.state} ({selectedClientForDetails.country})
                </span>
              </div>
              {selectedClientForDetails.notes && (
                <div className="pt-1.5 border-t border-slate-200 text-slate-500 italic">
                  &ldquo;{selectedClientForDetails.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Sales History List */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Recibos / Compras Realizadas ({clientDetailsSales.length})
                </h4>
              </div>

              {detailsLoading ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Carregando histórico...
                </div>
              ) : clientDetailsSales.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                  Este cliente ainda não possui compras registradas.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {clientDetailsSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-blue-700">
                          {sale.receipt_number}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDateTime(sale.created_at)} • {sale.payment_method}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {formatCurrency(sale.total_amount)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedClientForDetails(null);
                            onSelectSaleForReceipt(sale.id);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          Ver Recibo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedClientForDetails(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
