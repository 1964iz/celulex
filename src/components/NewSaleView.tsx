import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  UserCheck,
  Smartphone,
  CreditCard,
  Receipt,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { Client, Device } from '../types';
import { formatCurrency, formatCPF, formatPhone } from '../utils/formatters';

interface NewSaleViewProps {
  clients: Client[];
  devices: Device[];
  onOpenNewClientModal: () => void;
  onSaleCompleted: (saleData: any) => void;
}

interface CartItem {
  device_id: number;
  brand: string;
  model: string;
  storage?: string;
  color?: string;
  imei?: string;
  unit_price: number;
  quantity: number;
  max_stock: number;
}

export const NewSaleView: React.FC<NewSaleViewProps> = ({
  clients,
  devices,
  onOpenNewClientModal,
  onSaleCompleted,
}) => {
  // Selected Client
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Selected Device to add to cart
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCustomPrice, setItemCustomPrice] = useState<string>('');
  const [itemCustomImei, setItemCustomImei] = useState<string>('');

  // Cart Items
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [discount, setDiscount] = useState<string>('0');
  const [saleNotes, setSaleNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const selectedClient = clients.find((c) => String(c.id) === selectedClientId);
  const chosenDevice = devices.find((d) => String(d.id) === selectedDeviceId);

  // When device changes in selector, reset custom price and imei defaults
  const handleDeviceChange = (devId: string) => {
    setSelectedDeviceId(devId);
    setItemQuantity(1);
    const dev = devices.find((d) => String(d.id) === devId);
    if (dev) {
      setItemCustomPrice(String(dev.sell_price));
      setItemCustomImei(dev.imei || '');
    } else {
      setItemCustomPrice('');
      setItemCustomImei('');
    }
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!chosenDevice) return;

    if (chosenDevice.stock_quantity <= 0) {
      setErrorMessage(`O aparelho ${chosenDevice.brand} ${chosenDevice.model} está esgotado no estoque.`);
      return;
    }

    const price = parseFloat(itemCustomPrice) || chosenDevice.sell_price;
    const qty = itemQuantity;

    // Check if item is already in cart
    const existingIndex = cart.findIndex((i) => i.device_id === chosenDevice.id);
    const currentCartQty = existingIndex >= 0 ? cart[existingIndex].quantity : 0;

    if (currentCartQty + qty > chosenDevice.stock_quantity) {
      setErrorMessage(
        `Estoque insuficiente! Disponível: ${chosenDevice.stock_quantity}, no carrinho: ${currentCartQty}, adição: ${qty}.`
      );
      return;
    }

    setErrorMessage('');

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += qty;
      updatedCart[existingIndex].unit_price = price;
      if (itemCustomImei) updatedCart[existingIndex].imei = itemCustomImei;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          device_id: chosenDevice.id,
          brand: chosenDevice.brand,
          model: chosenDevice.model,
          storage: chosenDevice.storage,
          color: chosenDevice.color,
          imei: itemCustomImei || chosenDevice.imei,
          unit_price: price,
          quantity: qty,
          max_stock: chosenDevice.stock_quantity,
        },
      ]);
    }

    // Reset device selection
    setSelectedDeviceId('');
    setItemQuantity(1);
    setItemCustomPrice('');
    setItemCustomImei('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    const item = cart[index];
    if (newQty > item.max_stock) {
      setErrorMessage(`Estoque máximo disponível para este item é de ${item.max_stock} unidades.`);
      return;
    }
    setErrorMessage('');
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  const discountVal = Math.max(0, parseFloat(discount) || 0);
  const total = Math.max(0, subtotal - discountVal);

  // Submit Sale
  const handleFinalizeSale = async () => {
    setErrorMessage('');

    if (!selectedClientId) {
      setErrorMessage('Por favor, selecione o cliente comprador.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Adicione pelo menos um aparelho ao pedido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        client_id: parseInt(selectedClientId, 10),
        items: cart.map((i) => ({
          device_id: i.device_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          imei: i.imei,
        })),
        payment_method: paymentMethod,
        installments: paymentMethod === 'Cartão de Crédito' ? installments : 1,
        discount: discountVal,
        notes: saleNotes.trim(),
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao finalizar venda.');
      }

      // Success! Reset and notify
      setCart([]);
      setSelectedClientId('');
      setDiscount('0');
      setSaleNotes('');
      onSaleCompleted(data.sale);
    } catch (err: any) {
      console.error('Error finalizing sale:', err);
      setErrorMessage(err.message || 'Erro inesperado ao registrar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ponto de Venda (PDV) & Emissão de Recibo</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Vincule o cliente, selecione os aparelhos com baixa automática de estoque e emita o recibo legal de pagamento.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client & Device Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. SELEÇÃO DO CLIENTE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900">Identificação do Cliente</h3>
              </div>
              <button
                type="button"
                onClick={onOpenNewClientModal}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + Novo Cliente
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecione o Cliente Cadastrado *
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Escolha um cliente para vincular à venda --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (CPF: {formatCPF(c.cpf)}) - {c.city}/{c.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Client Card Details */}
            {selectedClient && (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{selectedClient.name}</span>
                  <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    CPF: {formatCPF(selectedClient.cpf)}
                  </span>
                </div>
                <div className="text-slate-600">
                  WhatsApp: <span className="font-medium text-slate-800">{formatPhone(selectedClient.whatsapp)}</span> • Email: {selectedClient.email}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Endereço: {selectedClient.address} - {selectedClient.city}/{selectedClient.state}
                </div>
              </div>
            )}
          </div>

          {/* 2. SELEÇÃO DE APARELHOS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900">Adicionar Aparelho Celular</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aparelho do Estoque *
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Selecione o aparelho para adicionar --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.stock_quantity <= 0}>
                      {d.brand} {d.model} {d.storage && `(${d.storage})`} {d.color && `- ${d.color}`} —{' '}
                      {formatCurrency(d.sell_price)} [{d.stock_quantity <= 0 ? 'ESGOTADO' : `${d.stock_quantity} em estoque`}]
                    </option>
                  ))}
                </select>
              </div>

              {chosenDevice && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={chosenDevice.stock_quantity}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Disponível: {chosenDevice.stock_quantity} un.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preço Unitário (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemCustomPrice}
                      onChange={(e) => setItemCustomPrice(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-bold font-mono text-blue-700 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Custo: {formatCurrency(chosenDevice.cost_price)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IMEI do Aparelho
                    </label>
                    <input
                      type="text"
                      placeholder="358742091234567"
                      value={itemCustomImei}
                      onChange={(e) => setItemCustomImei(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={chosenDevice.stock_quantity <= 0}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Aparelho ao Pedido
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary, Payment, Finalize */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900">Resumo da Venda ({cart.length} itens)</h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Limpar Carrinho
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-slate-600">O carrinho está vazio</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Adicione aparelhos para compor a venda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.brand} {item.model}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {item.storage && <span>{item.storage}</span>}
                        {item.color && <span>• {item.color}</span>}
                        {item.imei && <span className="font-mono text-slate-400">• IMEI: {item.imei}</span>}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 font-mono mt-1">
                        {formatCurrency(item.unit_price)} un.
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-md overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-bold font-mono text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold font-mono text-slate-900 block">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forma de Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        paymentMethod === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Installments if Credit Card */}
              {paymentMethod === 'Cartão de Crédito' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatCurrency(total / n)} {n === 1 ? '(à vista)' : 'sem juros'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Discount */}
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Desconto Concedido (R$):
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 px-3 py-1 text-right text-xs font-mono font-semibold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações da Venda (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Brinde película de vidro incluída"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200/80">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} aparelhos):</span>
                <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Desconto:</span>
                  <span className="font-mono font-medium">-{formatCurrency(discountVal)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total a Pagar:</span>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Finalize Button */}
            <button
              id="btn-finalize-sale"
              type="button"
              disabled={isSubmitting || cart.length === 0 || !selectedClientId}
              onClick={handleFinalizeSale}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                isSubmitting || cart.length === 0 || !selectedClientId
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-98'
              }`}
            >
              {isSubmitting ? (
                <>Processando Venda...</>
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  Finalizar Venda & Emitir Recibo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
