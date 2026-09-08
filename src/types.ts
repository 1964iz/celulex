export interface Device {
  id: number;
  brand: string;
  model: string;
  storage?: string;
  color?: string;
  imei?: string;
  cost_price: number;
  sell_price: number;
  stock_quantity: number;
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  device_id: number;
  brand?: string;
  model?: string;
  type: 'ENTRADA' | 'SAIDA';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  cost_price?: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
}

export interface Client {
  id: number;
  cpf: string;
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  total_purchases?: number;
  total_spent?: number;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  device_id: number;
  brand: string;
  model: string;
  storage?: string;
  color?: string;
  imei?: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  receipt_number: string;
  client_id: number;
  client_name?: string;
  client_cpf?: string;
  client_whatsapp?: string;
  client_email?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  total_cost: number;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  installments: number;
  notes?: string;
  warranty_terms?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface StoreSettings {
  id: number;
  store_name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  warranty_days: number;
}

export interface DashboardStats {
  totalDevices: number;
  totalStockUnits: number;
  lowStockCount: number;
  totalClients: number;
  totalSalesCount: number;
  totalRevenue: number;
  totalProfit: number;
  recentSales: Sale[];
  lowStockDevices: Device[];
}
