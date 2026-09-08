import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Printer,
  FileText,
  User,
  CreditCard,
} from 'lucide-react';
import { Sale } from '../types';
import { formatCurrency, formatDateTime, formatCPF } from '../utils/formatters';

interface SalesHistoryViewProps {
  sales: Sale[];
  onSelectSaleForReceipt: (saleId: number) => void;
  onNavigateToNewSale: () => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  onSelectSaleForReceipt,
  onNavigateToNewSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = sales.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.receipt_number.toLowerCase().includes(term) ||
      (s.client_name && s.client_name.toLowerCase().includes(term)) ||
      (s.client_cpf && s.client_cpf.includes(term)) ||
      (s.payment_method && s.payment_method.toLowerCase().includes(term))
    );
  });

  const totalSalesVolume = filteredSales.reduce((acc, s) => acc + s.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Histórico de Vendas & Recibos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulte todas as transações realizadas, emita 2ª via de recibos e imprima comprovantes com termo de garantia.
          </p>
        </div>

        <button
          onClick={onNavigateToNewSale}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
        >
          <Receipt className="w-4 h-4" />
          Registrar Nova Venda
        </button>
      </div>

      {/* Search & Quick Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número do recibo (REC-...), nome do cliente ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 self-end sm:self-auto">
          <span>{filteredSales.length} vendas filtradas</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-mono font-bold">
            Total: {formatCurrency(totalSalesVolume)}
          </span>
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhuma venda encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhuma venda corresponde aos termos pesquisados.'
              : 'As vendas registradas aparecerão aqui acompanhadas dos seus respectivos recibos.'}
          </p>
          <button
            onClick={onNavigateToNewSale}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Registrar Primeira Venda
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Nº do Recibo</th>
                  <th className="py-3.5 px-4">Data / Hora</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Forma Pagto</th>
                  <th className="py-3.5 px-4">Valor Total</th>
                  <th className="py-3.5 px-4 text-right">Recibo & Impressão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Receipt Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs">
                        {sale.receipt_number}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {formatDateTime(sale.created_at)}
                    </td>

                    {/* Client */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {sale.client_name || 'Cliente Avulso'}
                      </div>
                      {sale.client_cpf && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          CPF: {formatCPF(sale.client_cpf)}
                        </div>
                      )}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <CreditCard className="w-3 h-3 text-slate-500" />
                        {sale.payment_method}
                        {sale.installments > 1 && ` (${sale.installments}x)`}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(sale.total_amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectSaleForReceipt(sale.id)}
                          title="Visualizar e Imprimir Recibo"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          Visualizar Recibo
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
    </div>
  );
};
