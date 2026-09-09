import React from 'react';
import {
  Smartphone,
  Users,
  ShoppingCart,
  Receipt,
  LayoutDashboard,
  Settings,
  HelpCircle,
  PlusCircle,
  Database,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface NavbarProps {
  activeTab: 'dashboard' | 'devices' | 'clients' | 'new-sale' | 'sales';
  setActiveTab: (tab: 'dashboard' | 'devices' | 'clients' | 'new-sale' | 'sales') => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  lowStockCount: number;
  storeSettings?: StoreSettings | null;
  onRepairDatabase?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenHelp,
  lowStockCount,
  storeSettings,
  onRepairDatabase,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">CellVendas</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SQLite Ativo
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Gestão de Vendas & Estoque de Celulares</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-dashboard-tab"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Painel
            </button>

            <button
              id="nav-devices-tab"
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'devices'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Aparelhos & Estoque
              {lowStockCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              id="nav-clients-tab"
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Clientes
            </button>

            <button
              id="nav-sales-tab"
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sales'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Vendas & Recibos
            </button>
          </nav>

          {/* Quick Action & Utility Buttons */}
          <div className="flex items-center gap-2">
            {/* Responsável Técnico Badge */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-500">Resp. Técnico:</span>
                <span className="font-semibold text-slate-800">
                  {storeSettings?.tech_manager || 'W2 Suporte Técnico'}
                </span>
                <span className="text-slate-300">•</span>
                <a
                  href={`https://wa.me/55${(storeSettings?.tech_phone || '16999654150').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                  title="WhatsApp do Suporte"
                >
                  <Phone className="w-3 h-3" />
                  {storeSettings?.tech_phone || '(16) 99965-4150'}
                </a>
              </div>
            </div>

            <button
              id="btn-quick-new-sale"
              onClick={() => setActiveTab('new-sale')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs ${
                activeTab === 'new-sale'
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Venda</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              title="Configurações da Loja"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              id="btn-open-help"
              onClick={onOpenHelp}
              title="Instruções e Ajuda"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden items-center justify-between py-2.5 border-t border-slate-100 overflow-x-auto text-xs gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Painel
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'devices' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Aparelhos {lowStockCount > 0 ? `(${lowStockCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'clients' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'sales' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Vendas
          </button>
        </div>
      </div>
    </header>
  );
};
