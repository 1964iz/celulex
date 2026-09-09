import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Building2,
  Calendar,
  Share2,
  FileCheck,
} from 'lucide-react';
import { Sale, StoreSettings } from '../types';
import { formatCurrency, formatDateTime, formatDate, formatCPF, formatPhone } from '../utils/formatters';

interface ReceiptModalProps {
  sale: Sale | null;
  store: StoreSettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  store,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!sale) return null;

  const defaultStore: StoreSettings = store || {
    id: 1,
    store_name: 'CellStore Vendas & Assistência',
    cnpj: '34.567.890/0001-12',
    phone: '(16) 99965-4150',
    email: 'w2suporte@gmail.com',
    address: 'Rua das Palmeiras, 350 - Centro',
    city: 'São Paulo',
    state: 'SP',
    warranty_days: 90,
    tech_manager: 'W2 Suporte Técnico',
    tech_phone: '(16) 99965-4150',
    tech_email: 'w2suporte@gmail.com',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
*${defaultStore.store_name}*
CNPJ: ${defaultStore.cnpj}
Tel: ${defaultStore.phone}
Resp. Técnico: ${defaultStore.tech_manager || 'W2 Suporte Técnico'} - ${defaultStore.tech_phone || '(16) 99965-4150'}
----------------------------------------
*COMPROVANTE DE PAGAMENTO & GARANTIA*
Recibo Nº: ${sale.receipt_number}
Data: ${formatDateTime(sale.created_at)}

*DADOS DO CLIENTE:*
Nome: ${sale.client_name}
CPF: ${formatCPF(sale.client_cpf || '')}
WhatsApp: ${formatPhone(sale.client_whatsapp || '')}
Endereço: ${sale.client_address || ''} - ${sale.client_city || ''}/${sale.client_state || ''}

*APARELHOS:*
${(sale.items || [])
  .map(
    (item, i) =>
      `${i + 1}. ${item.brand} ${item.model} ${item.storage ? `(${item.storage})` : ''} ${item.color ? `- ${item.color}` : ''}
   Qtd: ${item.quantity} un. x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}
   ${item.imei ? `IMEI: ${item.imei}` : ''}`
  )
  .join('\n')}

----------------------------------------
Subtotal: ${formatCurrency(sale.subtotal)}
${sale.discount > 0 ? `Desconto: -${formatCurrency(sale.discount)}\n` : ''}*TOTAL PAGO: ${formatCurrency(sale.total_amount)}*
Forma de Pagamento: ${sale.payment_method}${sale.installments > 1 ? ` (${sale.installments}x)` : ''}
----------------------------------------
*TERMO DE GARANTIA:*
Garantia legal de ${defaultStore.warranty_days} dias para funcionamento a partir desta data, conforme o Código de Defesa do Consumidor (Art. 26).
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden print:m-0 print:border-0 print:shadow-none print:max-w-none print:w-full">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Recibo de Venda & Garantia</span>
            <span className="text-xs text-slate-400 font-mono">({sale.receipt_number})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              title="Copiar texto para WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Texto
                </>
              )}
            </button>

            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 ml-1"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
            PRINTABLE RECEIPT CONTENT AREA
           ========================================================= */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white font-sans text-xs">
          {/* Header Store Info */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight">
                {defaultStore.store_name}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                CNPJ: {defaultStore.cnpj}
              </p>
              <p className="text-xs text-slate-600">
                {defaultStore.address} - {defaultStore.city} / {defaultStore.state}
              </p>
              <p className="text-xs text-slate-600">
                Tel/WhatsApp: {defaultStore.phone} • E-mail: {defaultStore.email}
              </p>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <span className="inline-block px-3 py-1 bg-slate-100 font-bold text-slate-900 text-xs rounded uppercase tracking-wider mb-1">
                Recibo de Pagamento
              </span>
              <div className="font-mono font-bold text-sm text-blue-800">
                {sale.receipt_number}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3 h-3" />
                {formatDateTime(sale.created_at)}
              </div>
            </div>
          </div>

          {/* Customer Identification Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Dados do Comprador
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <span className="text-slate-500">Nome:</span>{' '}
                <span className="font-bold text-slate-900">{sale.client_name}</span>
              </div>
              <div>
                <span className="text-slate-500">CPF:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">
                  {formatCPF(sale.client_cpf || '')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Telefone / WhatsApp:</span>{' '}
                <span className="font-medium text-slate-900">
                  {formatPhone(sale.client_whatsapp || '')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">E-mail:</span>{' '}
                <span className="text-slate-900">{sale.client_email}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Endereço:</span>{' '}
                <span className="text-slate-900">
                  {sale.client_address} - {sale.client_city} / {sale.client_state} ({sale.client_country || 'Brasil'})
                </span>
              </div>
            </div>
          </div>

          {/* Sold Items Table */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Aparelho(s) Celular(es) Vendido(s)
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Descrição do Aparelho</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Valor Unit.</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(sale.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">
                          {item.brand} {item.model}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.storage && <span>{item.storage} </span>}
                          {item.color && <span>• Cor: {item.color} </span>}
                          {item.imei && (
                            <span className="font-mono text-slate-700 font-semibold block sm:inline">
                              • IMEI: {item.imei}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals & Payment Method */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1 space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">
                Forma de Pagamento
              </span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{sale.payment_method}</span>
                {sale.installments > 1 && (
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    em {sale.installments}x de {formatCurrency(sale.total_amount / sale.installments)}
                  </span>
                )}
              </div>
              {sale.notes && (
                <div className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200">
                  Obs: {sale.notes}
                </div>
              )}
            </div>

            <div className="sm:w-64 space-y-1.5 text-right bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Desconto:</span>
                  <span className="font-mono">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-1.5 border-t border-slate-200">
                <span>Total Pago:</span>
                <span className="font-mono text-base text-emerald-800">
                  {formatCurrency(sale.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Warranty & Terms Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1 text-[11px] text-slate-600 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Termo de Garantia Legal ({defaultStore.warranty_days} Dias)</span>
            </div>
            <p>
              O presente recibo comprova a venda dos aparelhos discriminados e garante cobertura pelo prazo legal de{' '}
              <strong>{defaultStore.warranty_days} (noventa) dias</strong> contra vícios ocultos e defeitos funcionais de fabricação, conforme estabelece o Art. 26, inciso II do Código de Defesa do Consumidor (Lei Federal nº 8.078/1990).
            </p>
            <p className="text-[10px] text-slate-500">
              A garantia não abrange danos decorrentes de acidentes, quedas, trincas na tela, oxidação por contato com água/líquidos, uso de carregadores incompatíveis ou violação de selos de segurança. A apresentação deste recibo é necessária para atendimento.
            </p>
            <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1">
              <span>
                <strong>Responsável Técnico:</strong> {defaultStore.tech_manager || 'W2 Suporte Técnico'}
              </span>
              <span>
                <strong>Tel/WhatsApp:</strong> {defaultStore.tech_phone || '(16) 99965-4150'} | <strong>E-mail:</strong> {defaultStore.tech_email || 'w2suporte@gmail.com'}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center">
            <div className="space-y-1">
              <div className="border-t border-slate-400 mx-auto w-4/5 pt-1"></div>
              <p className="font-bold text-[11px] text-slate-900">{defaultStore.store_name}</p>
              <p className="text-[10px] text-slate-400">Assinatura do Vendedor / Loja</p>
            </div>

            <div className="space-y-1">
              <div className="border-t border-slate-400 mx-auto w-4/5 pt-1"></div>
              <p className="font-bold text-[11px] text-slate-900">{sale.client_name}</p>
              <p className="text-[10px] text-slate-400">Assinatura do Cliente Comprador</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions (No Print) */}
        <div className="no-print bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dica: Utilize a opção de salvar em PDF na caixa de impressão do navegador.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
