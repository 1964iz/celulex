/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DevicesView } from './components/DevicesView';
import { ClientsView } from './components/ClientsView';
import { NewSaleView } from './components/NewSaleView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { InstructionsModal } from './components/InstructionsModal';
import { Device, Client, Sale, StockMovement, DashboardStats, StoreSettings } from './types';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'devices' | 'clients' | 'new-sale' | 'sales'>('dashboard');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals & Selected items
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [selectedDeviceForMovement, setSelectedDeviceForMovement] = useState<Device | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load all initial data with resilient Promise.allSettled
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [dashRes, devRes, clientRes, saleRes, movRes, settRes] = await Promise.allSettled([
        fetch('/api/dashboard'),
        fetch('/api/devices'),
        fetch('/api/clients'),
        fetch('/api/sales'),
        fetch('/api/stock-movements'),
        fetch('/api/settings'),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        const dashData = await dashRes.value.json();
        setStats(dashData);
      } else {
        console.warn('Dashboard fetch issue, creating fallback stats');
      }

      if (devRes.status === 'fulfilled' && devRes.value.ok) {
        setDevices(await devRes.value.json());
      }
      if (clientRes.status === 'fulfilled' && clientRes.value.ok) {
        setClients(await clientRes.value.json());
      }
      if (saleRes.status === 'fulfilled' && saleRes.value.ok) {
        setSales(await saleRes.value.json());
      }
      if (movRes.status === 'fulfilled' && movRes.value.ok) {
        setMovements(await movRes.value.json());
      }
      if (settRes.status === 'fulfilled' && settRes.value.ok) {
        setStoreSettings(await settRes.value.json());
      }
    } catch (err: any) {
      console.error('Failed to load system data:', err);
      setLoadError('Falha ao comunicar com o servidor da aplicação: ' + (err.message || ''));
      showToast('Falha ao comunicar com o servidor da aplicação.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Database self-healing and repair handler
  const handleRepairDatabase = async () => {
    try {
      showToast('Verificando e sincronizando banco de dados...', 'success');
      const res = await fetch('/api/database/repair', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Banco de dados reparado com sucesso!', 'success');
        await loadAllData();
      } else {
        showToast(data.message || 'Erro ao reparar banco.', 'error');
      }
    } catch (err: any) {
      showToast('Erro ao acionar reparo: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Open receipt for specific sale ID
  const handleSelectSaleForReceipt = async (saleId: number) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      if (!res.ok) throw new Error('Não foi possível carregar o recibo.');
      const fullSale = await res.json();
      setActiveReceiptSale(fullSale);
      if (fullSale.store) setStoreSettings(fullSale.store);
      setIsReceiptOpen(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Device actions
  const handleCreateDevice = async (deviceData: Partial<Device>): Promise<boolean> => {
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar aparelho.');
      showToast(`Aparelho ${data.brand} ${data.model} cadastrado com sucesso!`);
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleUpdateDevice = async (id: number, deviceData: Partial<Device>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar aparelho.');
      showToast('Aparelho atualizado com sucesso!');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleDeleteDevice = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir aparelho.');
      showToast('Aparelho removido com sucesso!');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleSubmitStockMovement = async (data: {
    deviceId: number;
    type: 'ENTRADA' | 'SAIDA';
    quantity: number;
    reason: string;
    notes?: string;
    cost_price?: number;
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/devices/${data.deviceId}/stock-movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const respData = await res.json();
      if (!res.ok) throw new Error(respData.error || 'Erro ao movimentar estoque.');
      showToast(respData.message || 'Movimentação realizada!');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Client actions
  const handleCreateClient = async (clientData: Partial<Client>): Promise<boolean> => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar cliente.');
      showToast(`Cliente ${data.name} cadastrado com sucesso!`);
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleUpdateClient = async (id: number, clientData: Partial<Client>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar cliente.');
      showToast('Cliente atualizado com sucesso!');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleDeleteClient = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir cliente.');
      showToast('Cliente removido!');
      loadAllData();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  // Sale completed handler
  const handleSaleCompleted = (saleData: any) => {
    showToast(`Venda ${saleData.receipt_number} realizada e estoque atualizado com sucesso!`);
    loadAllData();
    setActiveReceiptSale(saleData);
    if (saleData.store) setStoreSettings(saleData.store);
    setIsReceiptOpen(true);
  };

  // Settings Save
  const handleSaveSettings = async (settingsData: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar dados da loja.');
      setStoreSettings(data);
      showToast('Configurações da loja salvas com sucesso!');
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce no-print">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        lowStockCount={stats?.lowStockCount || 0}
        storeSettings={storeSettings}
        onRepairDatabase={handleRepairDatabase}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            loading={loading}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectSaleForReceipt={handleSelectSaleForReceipt}
            onSelectDeviceForMovement={(device) => {
              setSelectedDeviceForMovement(device);
              setActiveTab('devices');
            }}
            storeSettings={storeSettings}
            onRefresh={loadAllData}
            onRepairDatabase={handleRepairDatabase}
            loadError={loadError}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesView
            devices={devices}
            movements={movements}
            onRefresh={loadAllData}
            onSelectDeviceForMovement={(dev) => setSelectedDeviceForMovement(dev)}
            selectedDeviceForMovement={selectedDeviceForMovement}
            onCloseMovementModal={() => setSelectedDeviceForMovement(null)}
            onSubmitMovement={handleSubmitStockMovement}
            onCreateDevice={handleCreateDevice}
            onUpdateDevice={handleUpdateDevice}
            onDeleteDevice={handleDeleteDevice}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            onRefresh={loadAllData}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onSelectSaleForReceipt={handleSelectSaleForReceipt}
          />
        )}

        {activeTab === 'new-sale' && (
          <NewSaleView
            clients={clients}
            devices={devices}
            onOpenNewClientModal={() => setActiveTab('clients')}
            onSaleCompleted={handleSaleCompleted}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryView
            sales={sales}
            onSelectSaleForReceipt={handleSelectSaleForReceipt}
            onNavigateToNewSale={() => setActiveTab('new-sale')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">
              CellVendas © {new Date().getFullYear()} — Sistema de Gestão de Vendas & Estoque de Celulares
            </p>
            <p className="text-[11px] text-slate-500">
              Responsável Técnico: <strong className="text-slate-700">{storeSettings?.tech_manager || 'W2 Suporte Técnico'}</strong> • Tel/WhatsApp:{' '}
              <a
                href={`https://wa.me/55${(storeSettings?.tech_phone || '16999654150').replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-bold hover:underline"
              >
                {storeSettings?.tech_phone || '(16) 99965-4150'}
              </a>{' '}
              • E-mail:{' '}
              <a
                href={`mailto:${storeSettings?.tech_email || 'w2suporte@gmail.com'}`}
                className="text-blue-600 hover:underline"
              >
                {storeSettings?.tech_email || 'w2suporte@gmail.com'}
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Manual & Instruções
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              Configurações
            </button>
          </div>
        </div>
      </footer>

      {/* Receipt Modal (View & Print) */}
      {isReceiptOpen && activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          store={storeSettings}
          onClose={() => {
            setIsReceiptOpen(false);
            setActiveReceiptSale(null);
          }}
        />
      )}

      {/* Store Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={storeSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Instructions & Manual Modal */}
      <InstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
