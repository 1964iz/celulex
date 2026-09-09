import React from 'react';
import { X, Terminal, Database, ShieldCheck, CheckCircle2, Server, Smartphone, BookOpen, Phone, Mail } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Manual do Sistema & Instruções Técnicas
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Responsible Highlight Card */}
        <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Responsável Técnico do Sistema</span>
            </div>
            <p className="text-slate-700">
              <strong>W2 Suporte Técnico</strong> — Manutenção, banco de dados e suporte operacional.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://wa.me/5516999654150?text=Olá,%20preciso%20de%20suporte%20no%20sistema%20CellVendas"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              (16) 99965-4150
            </a>
            <a
              href="mailto:w2suporte@gmail.com"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              w2suporte@gmail.com
            </a>
          </div>
        </div>

        {/* Stack & Architecture */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-blue-600" />
            Arquitetura & Stack Utilizada
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">Backend & API:</span>
              <p className="text-slate-600">
                Node.js com Express e TypeScript. Rotas RESTful com validação robusta de entrada, baixa atômica de estoque e geração de recibos.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">Banco de Dados Relacional:</span>
              <p className="text-slate-600">
                SQLite nativo com chaves estrangeiras (`devices`, `stock_movements`, `clients`, `sales`, `sale_items`, `store_settings`) persistido em arquivo.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">Frontend:</span>
              <p className="text-slate-600">
                React 19 + TypeScript + Vite + Tailwind CSS, com componentes modulares e interface otimizada para vendedores.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">Impressão de Recibos:</span>
              <p className="text-slate-600">
                CSS formatado com `@media print` para exportação direta em PDF ou impressão em impressoras térmicas / A4 sem botões de tela.
              </p>
            </div>
          </div>
        </div>

        {/* Commands and Installation */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-slate-700" />
            Comandos de Instalação e Execução
          </h4>
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2.5">
            <div>
              <p className="text-slate-400"># 1. Instalar dependências:</p>
              <p className="text-emerald-400 font-bold">npm install</p>
            </div>
            <div>
              <p className="text-slate-400"># 2. Iniciar o servidor em desenvolvimento (Express + Vite):</p>
              <p className="text-emerald-400 font-bold">npm run dev</p>
            </div>
            <div>
              <p className="text-slate-400"># 3. Compilar para produção (Vite + esbuild bundle do backend):</p>
              <p className="text-emerald-400 font-bold">npm run build</p>
            </div>
            <div>
              <p className="text-slate-400"># 4. Executar em modo de produção:</p>
              <p className="text-emerald-400 font-bold">npm start</p>
            </div>
          </div>
        </div>

        {/* Operational Flow */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Fluxo Prático de Operação para Vendedores
          </h4>
          <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/70">
            <li>
              <strong>Cadastre ou Selecione o Cliente:</strong> O CPF é validado matematicamente com os dígitos verificadores da Receita Federal.
            </li>
            <li>
              <strong>Gerencie o Estoque:</strong> Cada novo aparelho recebe saldo inicial e alerta de estoque mínimo configurável.
            </li>
            <li>
              <strong>Faça a Venda no PDV:</strong> O sistema debita o estoque automaticamente, impede vendas sem saldo e calcula lucro/desconto.
            </li>
            <li>
              <strong>Emita o Recibo:</strong> O recibo com número único, dados do comprador, IMEI do celular e termos de garantia legal (90 dias CDC) é gerado para impressão ou envio por WhatsApp.
            </li>
          </ol>
        </div>

        <div className="pt-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
