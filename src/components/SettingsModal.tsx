import React, { useState, useEffect } from 'react';
import { X, Building2, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { StoreSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings | null;
  onSaveSettings: (settings: Partial<StoreSettings>) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState({
    store_name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'SP',
    warranty_days: '90',
    tech_manager: 'W2 Suporte Técnico',
    tech_phone: '(16) 99965-4150',
    tech_email: 'w2suporte@gmail.com',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        store_name: settings.store_name || '',
        cnpj: settings.cnpj || '',
        phone: settings.phone || '(16) 99965-4150',
        email: settings.email || 'w2suporte@gmail.com',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || 'SP',
        warranty_days: String(settings.warranty_days || 90),
        tech_manager: settings.tech_manager || 'W2 Suporte Técnico',
        tech_phone: settings.tech_phone || '(16) 99965-4150',
        tech_email: settings.tech_email || 'w2suporte@gmail.com',
      });
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await onSaveSettings({
      store_name: formData.store_name.trim(),
      cnpj: formData.cnpj.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      warranty_days: parseInt(formData.warranty_days, 10) || 90,
      tech_manager: formData.tech_manager.trim(),
      tech_phone: formData.tech_phone.trim(),
      tech_email: formData.tech_email.trim(),
    });
    setIsSaving(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Configurações da Loja</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-2">
          Estes dados são exibidos no cabeçalho e rodapé dos recibos e termos de garantia impressos.
        </p>

        {savedSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Dados da loja atualizados com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Fantasia / Razão Social da Loja *
            </label>
            <input
              type="text"
              required
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNPJ da Loja
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail de Contato
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Endereço da Loja
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UF
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm text-center uppercase font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prazo de Garantia Padrão (Dias)
            </label>
            <input
              type="number"
              min="30"
              value={formData.warranty_days}
              onChange={(e) => setFormData({ ...formData, warranty_days: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Padrão legal CDC para bens duráveis é de 90 dias.
            </span>
          </div>

          {/* Responsável Técnico Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Responsável Técnico & Suporte
              </h4>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Responsável Técnico
                </label>
                <input
                  type="text"
                  value={formData.tech_manager}
                  onChange={(e) => setFormData({ ...formData, tech_manager: e.target.value })}
                  placeholder="Ex: W2 Suporte Técnico"
                  className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp Técnico
                  </label>
                  <input
                    type="text"
                    value={formData.tech_phone}
                    onChange={(e) => setFormData({ ...formData, tech_phone: e.target.value })}
                    placeholder="(16) 99965-4150"
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail do Responsável Técnico
                  </label>
                  <input
                    type="email"
                    value={formData.tech_email}
                    onChange={(e) => setFormData({ ...formData, tech_email: e.target.value })}
                    placeholder="w2suporte@gmail.com"
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Essas informações identificam o responsável técnico no sistema, recibos e cabeçalho.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
