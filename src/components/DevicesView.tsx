import React, { useState } from 'react';
import {
  Smartphone,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  X,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Device, StockMovement } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface DevicesViewProps {
  devices: Device[];
  movements: StockMovement[];
  onRefresh: () => void;
  onSelectDeviceForMovement: (device: Device) => void;
  selectedDeviceForMovement: Device | null;
  onCloseMovementModal: () => void;
  onSubmitMovement: (data: {
    deviceId: number;
    type: 'ENTRADA' | 'SAIDA';
    quantity: number;
    reason: string;
    notes?: string;
    cost_price?: number;
  }) => Promise<boolean>;
  onCreateDevice: (data: Partial<Device>) => Promise<boolean>;
  onUpdateDevice: (id: number, data: Partial<Device>) => Promise<boolean>;
  onDeleteDevice: (id: number) => Promise<boolean>;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  movements,
  onRefresh,
  onSelectDeviceForMovement,
  selectedDeviceForMovement,
  onCloseMovementModal,
  onSubmitMovement,
  onCreateDevice,
  onUpdateDevice,
  onDeleteDevice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [viewSubTab, setViewSubTab] = useState<'catalog' | 'movements'>('catalog');

  // Modal states
  const [isNewDeviceModalOpen, setIsNewDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Form states for New / Edit Device
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    storage: '',
    color: '',
    imei: '',
    cost_price: '',
    sell_price: '',
    stock_quantity: '1',
    min_stock: '2',
  });

  // Movement Form
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [movementQty, setMovementQty] = useState('1');
  const [movementReason, setMovementReason] = useState('Compra de Fornecedor');
  const [movementNotes, setMovementNotes] = useState('');
  const [movementCost, setMovementCost] = useState('');
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementError, setMovementError] = useState('');

  // Extract unique brands for filtering
  const brands = Array.from(new Set(devices.map((d) => d.brand))).filter(Boolean);

  // Filtered devices
  const filteredDevices = devices.filter((d) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      d.brand.toLowerCase().includes(term) ||
      d.model.toLowerCase().includes(term) ||
      (d.imei && d.imei.toLowerCase().includes(term)) ||
      (d.color && d.color.toLowerCase().includes(term));

    const matchesBrand = selectedBrand === 'ALL' || d.brand === selectedBrand;
    const matchesLowStock = !filterLowStockOnly || d.stock_quantity <= d.min_stock;

    return matchesSearch && matchesBrand && matchesLowStock;
  });

  const openNewDeviceModal = () => {
    setFormData({
      brand: '',
      model: '',
      storage: '128GB',
      color: '',
      imei: '',
      cost_price: '',
      sell_price: '',
      stock_quantity: '1',
      min_stock: '2',
    });
    setEditingDevice(null);
    setIsNewDeviceModalOpen(true);
  };

  const openEditDeviceModal = (dev: Device) => {
    setEditingDevice(dev);
    setFormData({
      brand: dev.brand,
      model: dev.model,
      storage: dev.storage || '',
      color: dev.color || '',
      imei: dev.imei || '',
      cost_price: String(dev.cost_price),
      sell_price: String(dev.sell_price),
      stock_quantity: String(dev.stock_quantity),
      min_stock: String(dev.min_stock),
    });
    setIsNewDeviceModalOpen(true);
  };

  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.model.trim()) {
      alert('Preencha marca e modelo.');
      return;
    }

    const payload = {
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      storage: formData.storage.trim(),
      color: formData.color.trim(),
      imei: formData.imei.trim(),
      cost_price: parseFloat(formData.cost_price) || 0,
      sell_price: parseFloat(formData.sell_price) || 0,
      stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
      min_stock: parseInt(formData.min_stock, 10) || 2,
    };

    let success = false;
    if (editingDevice) {
      success = await onUpdateDevice(editingDevice.id, payload);
    } else {
      success = await onCreateDevice(payload);
    }

    if (success) {
      setIsNewDeviceModalOpen(false);
      setEditingDevice(null);
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceForMovement) return;
    setMovementError('');

    const qty = parseInt(movementQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setMovementError('A quantidade deve ser maior que zero.');
      return;
    }

    if (movementType === 'SAIDA' && selectedDeviceForMovement.stock_quantity < qty) {
      setMovementError(
        `Estoque insuficiente. Saldo atual: ${selectedDeviceForMovement.stock_quantity}, saída: ${qty}.`
      );
      return;
    }

    setMovementLoading(true);
    const success = await onSubmitMovement({
      deviceId: selectedDeviceForMovement.id,
      type: movementType,
      quantity: qty,
      reason: movementReason,
      notes: movementNotes,
      cost_price: movementCost ? parseFloat(movementCost) : undefined,
    });
    setMovementLoading(false);

    if (success) {
      onCloseMovementModal();
      setMovementQty('1');
      setMovementNotes('');
      setMovementError('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestão de Aparelhos Celulares</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre modelos, controle entradas e saídas de estoque e acompanhe a disponibilidade em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tabs: Catálogo vs Histórico de Movimentações */}
          <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewSubTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewSubTab === 'catalog' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo ({devices.length})
            </button>
            <button
              onClick={() => setViewSubTab('movements')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                viewSubTab === 'movements' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Histórico de Estoque
            </button>
          </div>

          {viewSubTab === 'catalog' && (
            <button
              id="btn-add-device"
              onClick={openNewDeviceModal}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Novo Aparelho
            </button>
          )}
        </div>
      </div>

      {viewSubTab === 'catalog' ? (
        <>
          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por marca, modelo, cor ou IMEI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                    filterLowStockOnly
                      ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Apenas Estoque Baixo
                </button>
              </div>
            </div>

            {/* Brand Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Marca:
              </span>
              <button
                onClick={() => setSelectedBrand('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedBrand === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({devices.length})
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    selectedBrand === b
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Devices Grid / Table */}
          {filteredDevices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Nenhum aparelho encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || filterLowStockOnly || selectedBrand !== 'ALL'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Comece cadastrando os primeiros celulares para gerenciar seu estoque.'}
              </p>
              <button
                onClick={openNewDeviceModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Cadastrar Aparelho
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Aparelho / Detalhes</th>
                      <th className="py-3.5 px-4">Preço Custo</th>
                      <th className="py-3.5 px-4">Preço Venda</th>
                      <th className="py-3.5 px-4">Margem Bruta</th>
                      <th className="py-3.5 px-4">Estoque Atual</th>
                      <th className="py-3.5 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDevices.map((dev) => {
                      const isLowStock = dev.stock_quantity <= dev.min_stock;
                      const isZero = dev.stock_quantity === 0;
                      const margin = dev.sell_price - dev.cost_price;
                      const marginPercent =
                        dev.sell_price > 0 ? Math.round((margin / dev.sell_price) * 100) : 0;

                      return (
                        <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Device details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                                {dev.brand.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                  <span>{dev.brand} {dev.model}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {dev.storage && (
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium text-[11px]">
                                      {dev.storage}
                                    </span>
                                  )}
                                  {dev.color && (
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                                      {dev.color}
                                    </span>
                                  )}
                                  {dev.imei && (
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      IMEI: {dev.imei}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Cost Price */}
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {formatCurrency(dev.cost_price)}
                          </td>

                          {/* Sell Price */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {formatCurrency(dev.sell_price)}
                          </td>

                          {/* Margin */}
                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              +{formatCurrency(margin)} ({marginPercent}%)
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                  isZero
                                    ? 'bg-rose-100 text-rose-800'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {isZero ? '0 un. (Esgotado)' : `${dev.stock_quantity} un.`}
                              </span>
                              {isLowStock && !isZero && (
                                <span
                                  title={`Estoque mínimo recomendado: ${dev.min_stock}`}
                                  className="text-amber-500 cursor-help"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onSelectDeviceForMovement(dev)}
                                title="Movimentar Estoque (Entrada/Saída)"
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                              >
                                <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />
                                Movimentar
                              </button>

                              <button
                                onClick={() => openEditDeviceModal(dev)}
                                title="Editar dados do aparelho"
                                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Tem certeza que deseja excluir o aparelho "${dev.brand} ${dev.model}"?`
                                    )
                                  ) {
                                    onDeleteDevice(dev.id);
                                  }
                                }}
                                title="Excluir aparelho"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Stock Movements Log View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Histórico Geral de Movimentações de Estoque
              </h3>
            </div>
            <span className="text-xs text-slate-500">Últimas 200 movimentações auditadas</span>
          </div>

          {movements.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-500">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Aparelho</th>
                    <th className="py-2.5 px-3">Quantidade</th>
                    <th className="py-2.5 px-3">Estoque Anterior &rarr; Novo</th>
                    <th className="py-2.5 px-3">Motivo / Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((mov) => {
                    const isEntrada = mov.type === 'ENTRADA';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {formatDateTime(mov.created_at)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isEntrada
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isEntrada ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            )}
                            {mov.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {mov.brand} {mov.model} {mov.color && `(${mov.color})`}
                        </td>
                        <td className="py-2.5 px-3 font-bold font-mono">
                          {isEntrada ? `+${mov.quantity}` : `-${mov.quantity}`} un.
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {mov.previous_stock} &rarr;{' '}
                          <span className="font-bold text-slate-900">{mov.new_stock}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <span className="font-medium text-slate-800">{mov.reason}</span>
                          {mov.notes && (
                            <span className="block text-slate-400 text-[11px]">{mov.notes}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODAL: NOVO / EDITAR APARELHO
         ========================================================= */}
      {isNewDeviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDevice ? 'Editar Aparelho' : 'Cadastrar Novo Aparelho'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewDeviceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeviceSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apple, Samsung, Xiaomi"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: iPhone 15, Galaxy S24"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Armazenamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 128GB, 256GB"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Titânio Natural, Preto"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IMEI / Identificador Único
                </label>
                <input
                  type="text"
                  placeholder="Ex: 358742091234567"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Custo (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.sell_price}
                    onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold text-blue-700 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingDevice && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estoque Inicial (unidades)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, stock_quantity: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
                <div className={editingDevice ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Dispara aviso quando o estoque atingir esse número ou menos.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDeviceModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  {editingDevice ? 'Salvar Alterações' : 'Cadastrar Aparelho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: MOVIMENTAÇÃO DE ESTOQUE (ENTRADA / SAÍDA)
         ========================================================= */}
      {selectedDeviceForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Movimentação de Estoque</h3>
                <p className="text-xs text-slate-500">
                  {selectedDeviceForMovement.brand} {selectedDeviceForMovement.model}
                </p>
              </div>
              <button
                onClick={onCloseMovementModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stock Banner */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/70">
              <span className="text-xs text-slate-600 font-medium">Estoque atual disponível:</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {selectedDeviceForMovement.stock_quantity} unidades
              </span>
            </div>

            {movementError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{movementError}</span>
              </div>
            )}

            <form onSubmit={handleMovementSubmit} className="space-y-4 mt-4">
              {/* Type Switcher: ENTRADA or SAIDA */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('ENTRADA');
                      setMovementReason('Compra de Fornecedor');
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      movementType === 'ENTRADA'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    ENTRADA (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('SAIDA');
                      setMovementReason('Ajuste de Inventário / Perda');
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      movementType === 'SAIDA'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    SAÍDA (-)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantidade de Aparelhos *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo da Movimentação *
                </label>
                <select
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {movementType === 'ENTRADA' ? (
                    <>
                      <option value="Compra de Fornecedor">Compra de Fornecedor</option>
                      <option value="Devolução de Cliente">Devolução de Cliente</option>
                      <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                      <option value="Troca por Garantia">Troca por Garantia</option>
                    </>
                  ) : (
                    <>
                      <option value="Ajuste de Inventário / Perda">Ajuste de Inventário / Perda</option>
                      <option value="Aparelho com Defeito / Assistência">Aparelho com Defeito / Assistência</option>
                      <option value="Devolução a Fornecedor">Devolução a Fornecedor</option>
                      <option value="Mostruário">Mostruário</option>
                    </>
                  )}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Número de Nota Fiscal
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: NF 1042 / Fornecedor TechDistribuidora"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Projected Result */}
              <div className="p-3 bg-blue-50/60 rounded-xl text-xs text-blue-900 flex items-center justify-between border border-blue-100">
                <span>Novo saldo após confirmação:</span>
                <span className="font-bold font-mono text-sm">
                  {movementType === 'ENTRADA'
                    ? selectedDeviceForMovement.stock_quantity + (parseInt(movementQty, 10) || 0)
                    : Math.max(
                        0,
                        selectedDeviceForMovement.stock_quantity - (parseInt(movementQty, 10) || 0)
                      )}{' '}
                  unidades
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseMovementModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={movementLoading}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-xs ${
                    movementType === 'ENTRADA'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {movementLoading ? 'Processando...' : 'Confirmar Movimentação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
