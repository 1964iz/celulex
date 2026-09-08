import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Smartphone,
  Users,
  AlertTriangle,
  Receipt,
  ArrowUpRight,
  PlusCircle,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import { DashboardStats, Device, Sale } from '../types';
import { formatCurrency, formatDateTime, formatCPF } from '../utils/formatters';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: 'dashboard' | 'devices' | 'clients' | 'new-sale' | 'sales') => void;
  onSelectSaleForReceipt: (saleId: number) => void;
  onSelectDeviceForMovement: (device: Device) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  onNavigate,
  onSelectSaleForReceipt,
  onSelectDeviceForMovement,
}) => {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/10 mb-2">
              <PackageCheck className="w-3.5 h-3.5 text-blue-300" />
              Painel Operacional
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestão de Vendas & Estoque</h1>
            <p className="text-blue-200 text-sm mt-1 max-w-xl">
              Controle de aparelhos celulares, movimentações em tempo real, base de clientes e emissão imediata de recibos de compra.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dash-btn-new-sale"
              onClick={() => onNavigate('new-sale')}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-98 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Nova Venda
            </button>
            <button
              id="dash-btn-devices"
              onClick={() => onNavigate('devices')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl transition-all border border-white/10 text-sm"
            >
              <Smartphone className="w-4 h-4" />
              Ver Aparelhos
            </button>
          </div>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Faturamento Total</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{stats.totalSalesCount}</span> vendas finalizadas
            </p>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lucro Bruto Estimado</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalProfit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Margem sobre custo dos aparelhos vendidos
            </p>
          </div>
        </div>

        {/* Total Devices & Units in Stock */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estoque de Aparelhos</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.totalStockUnits} <span className="text-sm font-normal text-slate-500">unidades</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.totalDevices} modelos cadastrados no catálogo
            </p>
          </div>
        </div>

        {/* Total Clients & Low Stock Alert */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clientes & Alertas</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
            }`}>
              {stats.lowStockCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.totalClients} <span className="text-sm font-normal text-slate-500">clientes</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.lowStockCount > 0 ? (
                  <span className="text-amber-600 font-semibold">{stats.lowStockCount} modelo(s) com estoque baixo</span>
                ) : (
                  'Nenhum alerta de estoque'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Low Stock Warning + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Alert Column */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-semibold text-slate-900">Alerta de Estoque Mínimo</h3>
              </div>
              <button
                onClick={() => onNavigate('devices')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                Gerenciar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.lowStockDevices.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800">Estoque equilibrado</p>
                <p className="text-xs text-slate-500 mt-0.5">Todos os aparelhos estão acima do estoque mínimo configurado.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {stats.lowStockDevices.map((dev) => (
                  <div key={dev.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {dev.brand} {dev.model}
                      </div>
                      <div className="text-xs text-slate-500">
                        {dev.storage && `${dev.storage} • `}
                        {dev.color && `${dev.color} • `}
                        Mínimo: {dev.min_stock} un.
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                        dev.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {dev.stock_quantity === 0 ? 'Esgotado' : `${dev.stock_quantity} un.`}
                      </span>
                      <button
                        onClick={() => onSelectDeviceForMovement(dev)}
                        title="Dar entrada no estoque"
                        className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        + Entrada
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('devices')}
              className="w-full text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Ver todos os {stats.totalDevices} aparelhos cadastrados
            </button>
          </div>
        </div>

        {/* Recent Sales Column */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-semibold text-slate-900">Últimas Vendas & Recibos</h3>
              </div>
              <button
                onClick={() => onNavigate('sales')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.recentSales.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Receipt className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-800">Nenhuma venda registrada ainda</p>
                <p className="text-xs text-slate-500 mt-0.5">Faça a primeira venda para emitir o recibo com garantia.</p>
                <button
                  onClick={() => onNavigate('new-sale')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                >
                  Registrar primeira venda
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {stats.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {sale.receipt_number}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateTime(sale.created_at)}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-1">
                        {sale.client_name || 'Cliente'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Pagamento: <span className="font-medium text-slate-700">{sale.payment_method}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(sale.total_amount)}
                      </span>
                      <button
                        onClick={() => onSelectSaleForReceipt(sale.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        Ver Recibo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total acumulado: {formatCurrency(stats.totalRevenue)}</span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Acessar Histórico Completo &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
