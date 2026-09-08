import { Router, Request, Response } from 'express';
import { getDb, queryAll, queryOne, saveDb } from './db.js';
import { validateCPF } from '../utils/formatters.js';

export const apiRouter = Router();

// ==========================================
// DASHBOARD STATS
// ==========================================
apiRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    const devCountRow = queryOne<{ count: number; total_units: number }>(
      db,
      'SELECT COUNT(*) as count, COALESCE(SUM(stock_quantity), 0) as total_units FROM devices;'
    );
    const lowStockRow = queryOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM devices WHERE stock_quantity <= min_stock;'
    );
    const clientCountRow = queryOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM clients;'
    );
    const salesStatsRow = queryOne<{ count: number; total_revenue: number; total_cost: number }>(
      db,
      'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_revenue, COALESCE(SUM(total_cost), 0) as total_cost FROM sales;'
    );

    const recentSales = queryAll(
      db,
      `SELECT s.*, c.name as client_name, c.cpf as client_cpf
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       ORDER BY s.created_at DESC
       LIMIT 5;`
    );

    const lowStockDevices = queryAll(
      db,
      `SELECT * FROM devices
       WHERE stock_quantity <= min_stock
       ORDER BY stock_quantity ASC
       LIMIT 8;`
    );

    const totalRevenue = salesStatsRow?.total_revenue || 0;
    const totalCost = salesStatsRow?.total_cost || 0;
    const totalProfit = totalRevenue - totalCost;

    res.json({
      totalDevices: devCountRow?.count || 0,
      totalStockUnits: devCountRow?.total_units || 0,
      lowStockCount: lowStockRow?.count || 0,
      totalClients: clientCountRow?.count || 0,
      totalSalesCount: salesStatsRow?.count || 0,
      totalRevenue,
      totalProfit,
      recentSales,
      lowStockDevices,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do dashboard: ' + error.message });
  }
});

// ==========================================
// DEVICES & STOCK
// ==========================================

// GET all devices
apiRouter.get('/devices', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { q, brand, lowStock } = req.query;

    let sql = 'SELECT * FROM devices WHERE 1=1';
    const params: any[] = [];

    if (q) {
      sql += ' AND (brand LIKE ? OR model LIKE ? OR imei LIKE ? OR color LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }

    if (lowStock === 'true') {
      sql += ' AND stock_quantity <= min_stock';
    }

    sql += ' ORDER BY brand ASC, model ASC;';

    const devices = queryAll(db, sql, params);
    res.json(devices);
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Erro ao buscar aparelhos: ' + error.message });
  }
});

// GET single device + movements
apiRouter.get('/devices/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const device = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [id]);

    if (!device) {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }

    const movements = queryAll(
      db,
      'SELECT * FROM stock_movements WHERE device_id = ? ORDER BY created_at DESC;',
      [id]
    );

    res.json({ ...device, movements });
  } catch (error: any) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do aparelho.' });
  }
});

// POST create device
apiRouter.post('/devices', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const {
      brand,
      model,
      storage,
      color,
      imei,
      cost_price,
      sell_price,
      stock_quantity = 0,
      min_stock = 2,
    } = req.body;

    if (!brand || !brand.trim()) {
      return res.status(400).json({ error: 'A marca do aparelho é obrigatória.' });
    }
    if (!model || !model.trim()) {
      return res.status(400).json({ error: 'O modelo do aparelho é obrigatório.' });
    }

    const numCost = parseFloat(cost_price);
    const numSell = parseFloat(sell_price);
    const numStock = parseInt(stock_quantity, 10) || 0;
    const numMin = parseInt(min_stock, 10) || 2;

    if (isNaN(numCost) || numCost < 0) {
      return res.status(400).json({ error: 'Preço de custo inválido.' });
    }
    if (isNaN(numSell) || numSell < 0) {
      return res.status(400).json({ error: 'Preço de venda inválido.' });
    }
    if (numStock < 0) {
      return res.status(400).json({ error: 'Estoque inicial não pode ser negativo.' });
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO devices (brand, model, storage, color, imei, cost_price, sell_price, stock_quantity, min_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        brand.trim(),
        model.trim(),
        storage?.trim() || '',
        color?.trim() || '',
        imei?.trim() || '',
        numCost,
        numSell,
        numStock,
        numMin,
        now,
        now,
      ]
    );

    const lastIdRes = db.exec('SELECT last_insert_rowid();');
    const newId = lastIdRes[0].values[0][0] as number;

    // If initial stock was provided, log stock movement
    if (numStock > 0) {
      db.run(
        `INSERT INTO stock_movements (device_id, type, quantity, previous_stock, new_stock, reason, cost_price, notes, created_at)
         VALUES (?, 'ENTRADA', ?, 0, ?, 'Estoque Inicial', ?, 'Cadastro do aparelho', ?);`,
        [newId, numStock, numStock, numCost, now]
      );
    }

    saveDb();

    const created = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [newId]);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Erro ao cadastrar aparelho: ' + error.message });
  }
});

// PUT update device
apiRouter.put('/devices/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const existing = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }

    const {
      brand,
      model,
      storage,
      color,
      imei,
      cost_price,
      sell_price,
      min_stock,
    } = req.body;

    if (!brand || !brand.trim()) {
      return res.status(400).json({ error: 'A marca é obrigatória.' });
    }
    if (!model || !model.trim()) {
      return res.status(400).json({ error: 'O modelo é obrigatório.' });
    }

    const numCost = parseFloat(cost_price);
    const numSell = parseFloat(sell_price);
    const numMin = parseInt(min_stock, 10) || 2;

    if (isNaN(numCost) || numCost < 0) {
      return res.status(400).json({ error: 'Preço de custo inválido.' });
    }
    if (isNaN(numSell) || numSell < 0) {
      return res.status(400).json({ error: 'Preço de venda inválido.' });
    }

    const now = new Date().toISOString();

    db.run(
      `UPDATE devices
       SET brand = ?, model = ?, storage = ?, color = ?, imei = ?, cost_price = ?, sell_price = ?, min_stock = ?, updated_at = ?
       WHERE id = ?;`,
      [
        brand.trim(),
        model.trim(),
        storage?.trim() || '',
        color?.trim() || '',
        imei?.trim() || '',
        numCost,
        numSell,
        numMin,
        now,
        id,
      ]
    );

    saveDb();

    const updated = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [id]);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Erro ao atualizar aparelho: ' + error.message });
  }
});

// DELETE device
apiRouter.delete('/devices/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);

    // Check if sales exist for this device
    const salesWithItem = queryOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM sale_items WHERE device_id = ?;',
      [id]
    );

    if (salesWithItem && salesWithItem.count > 0) {
      return res.status(400).json({
        error: `Não é possível excluir este aparelho pois existem ${salesWithItem.count} venda(s) vinculada(s) a ele.`,
      });
    }

    db.run('DELETE FROM devices WHERE id = ?;', [id]);
    saveDb();

    res.json({ message: 'Aparelho removido com sucesso.' });
  } catch (error: any) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Erro ao remover aparelho: ' + error.message });
  }
});

// POST stock movement (Entrada / Saída)
apiRouter.post('/devices/:id/stock-movement', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const device = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [id]);

    if (!device) {
      return res.status(404).json({ error: 'Aparelho não encontrado.' });
    }

    const { type, quantity, reason, notes, cost_price } = req.body;

    if (type !== 'ENTRADA' && type !== 'SAIDA') {
      return res.status(400).json({ error: 'Tipo de movimentação inválido. Use ENTRADA ou SAIDA.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'A quantidade deve ser um número maior que zero.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'O motivo da movimentação é obrigatório.' });
    }

    const previousStock = device.stock_quantity;
    let newStock = previousStock;

    if (type === 'ENTRADA') {
      newStock = previousStock + qty;
    } else {
      if (previousStock < qty) {
        return res.status(400).json({
          error: `Estoque insuficiente. Saldo atual: ${previousStock}, saída solicitada: ${qty}.`,
        });
      }
      newStock = previousStock - qty;
    }

    const now = new Date().toISOString();
    const movementCost = cost_price ? parseFloat(cost_price) : device.cost_price;

    // Update device stock
    db.run('UPDATE devices SET stock_quantity = ?, updated_at = ? WHERE id = ?;', [
      newStock,
      now,
      id,
    ]);

    // Insert movement log
    db.run(
      `INSERT INTO stock_movements (device_id, type, quantity, previous_stock, new_stock, reason, cost_price, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, type, qty, previousStock, newStock, reason.trim(), movementCost, notes?.trim() || '', now]
    );

    saveDb();

    const updatedDevice = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [id]);
    res.json({
      message: `Movimentação de ${type} registrada com sucesso!`,
      device: updatedDevice,
      previousStock,
      newStock,
    });
  } catch (error: any) {
    console.error('Error logging stock movement:', error);
    res.status(500).json({ error: 'Erro ao registrar movimentação de estoque: ' + error.message });
  }
});

// GET all stock movements log
apiRouter.get('/stock-movements', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { device_id, type } = req.query;

    let sql = `
      SELECT m.*, d.brand, d.model, d.color, d.storage
      FROM stock_movements m
      JOIN devices d ON m.device_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (device_id) {
      sql += ' AND m.device_id = ?';
      params.push(device_id);
    }
    if (type) {
      sql += ' AND m.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT 200;';

    const movements = queryAll(db, sql, params);
    res.json(movements);
  } catch (error: any) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de estoque.' });
  }
});

// ==========================================
// CLIENTS
// ==========================================

// GET all clients
apiRouter.get('/clients', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { q } = req.query;

    let sql = `
      SELECT c.*,
             COUNT(s.id) as total_purchases,
             COALESCE(SUM(s.total_amount), 0) as total_spent
      FROM clients c
      LEFT JOIN sales s ON c.id = s.client_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      sql += ' AND (c.name LIKE ? OR c.cpf LIKE ? OR c.whatsapp LIKE ? OR c.email LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    sql += ' GROUP BY c.id ORDER BY c.name ASC;';

    const clients = queryAll(db, sql, params);
    res.json(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Erro ao listar clientes: ' + error.message });
  }
});

// GET single client + sales
apiRouter.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const client = queryOne(db, 'SELECT * FROM clients WHERE id = ?;', [id]);

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const sales = queryAll(
      db,
      'SELECT * FROM sales WHERE client_id = ? ORDER BY created_at DESC;',
      [id]
    );

    res.json({ ...client, sales });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do cliente.' });
  }
});

// POST create client
apiRouter.post('/clients', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const {
      cpf,
      name,
      email,
      whatsapp,
      address,
      city,
      state,
      country = 'Brasil',
      notes,
    } = req.body;

    // Validations
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome completo do cliente é obrigatório.' });
    }

    if (!cpf || !cpf.trim()) {
      return res.status(400).json({ error: 'O CPF do cliente é obrigatório.' });
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (!validateCPF(cleanCpf)) {
      return res.status(400).json({ error: 'CPF inválido! Por favor verifique os dígitos digitados.' });
    }

    // Check duplicate CPF
    const existing = queryOne(db, 'SELECT id FROM clients WHERE cpf = ?;', [cleanCpf]);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um cliente cadastrado com este CPF.' });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Insira um e-mail válido.' });
    }

    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ error: 'O número de WhatsApp/telefone é obrigatório.' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'O endereço completo é obrigatório.' });
    }

    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'A cidade é obrigatória.' });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({ error: 'O estado (UF) é obrigatório.' });
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO clients (cpf, name, email, whatsapp, address, city, state, country, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        cleanCpf,
        name.trim(),
        email.trim().toLowerCase(),
        whatsapp.replace(/\D/g, ''),
        address.trim(),
        city.trim(),
        state.trim().toUpperCase(),
        country?.trim() || 'Brasil',
        notes?.trim() || '',
        now,
        now,
      ]
    );

    saveDb();

    const lastIdRes = db.exec('SELECT last_insert_rowid();');
    const newId = lastIdRes[0].values[0][0] as number;

    const created = queryOne(db, 'SELECT * FROM clients WHERE id = ?;', [newId]);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Erro ao cadastrar cliente: ' + error.message });
  }
});

// PUT update client
apiRouter.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);
    const existing = queryOne(db, 'SELECT * FROM clients WHERE id = ?;', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const {
      cpf,
      name,
      email,
      whatsapp,
      address,
      city,
      state,
      country = 'Brasil',
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome é obrigatório.' });
    }

    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : existing.cpf;
    if (!validateCPF(cleanCpf)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    // Check duplicate CPF for other client
    const duplicate = queryOne(db, 'SELECT id FROM clients WHERE cpf = ? AND id != ?;', [cleanCpf, id]);
    if (duplicate) {
      return res.status(400).json({ error: 'Já existe outro cliente com este CPF.' });
    }

    const now = new Date().toISOString();

    db.run(
      `UPDATE clients
       SET cpf = ?, name = ?, email = ?, whatsapp = ?, address = ?, city = ?, state = ?, country = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        cleanCpf,
        name.trim(),
        email.trim().toLowerCase(),
        whatsapp.replace(/\D/g, ''),
        address.trim(),
        city.trim(),
        state.trim().toUpperCase(),
        country?.trim() || 'Brasil',
        notes?.trim() || '',
        now,
        id,
      ]
    );

    saveDb();

    const updated = queryOne(db, 'SELECT * FROM clients WHERE id = ?;', [id]);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente: ' + error.message });
  }
});

// DELETE client
apiRouter.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);

    const salesCount = queryOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM sales WHERE client_id = ?;',
      [id]
    );

    if (salesCount && salesCount.count > 0) {
      return res.status(400).json({
        error: `Não é possível remover o cliente pois ele possui ${salesCount.count} venda(s) registradas.`,
      });
    }

    db.run('DELETE FROM clients WHERE id = ?;', [id]);
    saveDb();

    res.json({ message: 'Cliente removido com sucesso.' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

// ==========================================
// SALES & RECEIPTS
// ==========================================

// GET all sales
apiRouter.get('/sales', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { q, startDate, endDate } = req.query;

    let sql = `
      SELECT s.*, c.name as client_name, c.cpf as client_cpf, c.whatsapp as client_whatsapp,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as total_items_count
      FROM sales s
      JOIN clients c ON s.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q) {
      sql += ' AND (s.receipt_number LIKE ? OR c.name LIKE ? OR c.cpf LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    if (startDate) {
      sql += ' AND s.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND s.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY s.created_at DESC;';

    const sales = queryAll(db, sql, params);
    res.json(sales);
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas.' });
  }
});

// GET single sale with items & receipt
apiRouter.get('/sales/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = parseInt(req.params.id, 10);

    const sale = queryOne(
      db,
      `SELECT s.*,
              c.name as client_name, c.cpf as client_cpf, c.email as client_email,
              c.whatsapp as client_whatsapp, c.address as client_address,
              c.city as client_city, c.state as client_state, c.country as client_country
       FROM sales s
       JOIN clients c ON s.client_id = c.id
       WHERE s.id = ?;`,
      [id]
    );

    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    const items = queryAll(
      db,
      `SELECT si.*, d.color, d.storage
       FROM sale_items si
       LEFT JOIN devices d ON si.device_id = d.id
       WHERE si.sale_id = ?;`,
      [id]
    );

    const settings = queryOne(db, 'SELECT * FROM store_settings WHERE id = 1;') || {
      store_name: 'CellStore Vendas & Assistência',
      cnpj: '34.567.890/0001-12',
      phone: '(11) 98765-4321',
      email: 'contato@cellstore.com.br',
      address: 'Rua das Palmeiras, 350 - Centro',
      city: 'São Paulo',
      state: 'SP',
      warranty_days: 90,
    };

    res.json({
      ...sale,
      items,
      store: settings,
    });
  } catch (error: any) {
    console.error('Error fetching sale details:', error);
    res.status(500).json({ error: 'Erro ao carregar detalhes da venda.' });
  }
});

// POST register new sale
apiRouter.post('/sales', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const {
      client_id,
      items,
      payment_method = 'PIX',
      installments = 1,
      discount = 0,
      notes = '',
    } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'Selecione um cliente para a venda.' });
    }

    const client = queryOne(db, 'SELECT * FROM clients WHERE id = ?;', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Cliente não encontrado.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Adicione pelo menos um aparelho à venda.' });
    }

    // Validate each item and check stock
    const validatedItems: Array<{
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
      current_stock: number;
    }> = [];

    let subtotalSum = 0;
    let totalCostSum = 0;

    for (const item of items) {
      const deviceId = parseInt(item.device_id, 10);
      const qty = parseInt(item.quantity, 10);
      const unitPrice = parseFloat(item.unit_price);

      if (!deviceId || isNaN(deviceId)) {
        return res.status(400).json({ error: 'Aparelho inválido na lista.' });
      }

      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'A quantidade de cada item deve ser pelo menos 1.' });
      }

      const dev = queryOne(db, 'SELECT * FROM devices WHERE id = ?;', [deviceId]);
      if (!dev) {
        return res.status(400).json({ error: `Aparelho ID ${deviceId} não foi encontrado.` });
      }

      if (dev.stock_quantity < qty) {
        return res.status(400).json({
          error: `Estoque insuficiente para ${dev.brand} ${dev.model}. Disponível: ${dev.stock_quantity}, Solicitado: ${qty}.`,
        });
      }

      const finalPrice = !isNaN(unitPrice) && unitPrice >= 0 ? unitPrice : dev.sell_price;
      const itemSubtotal = finalPrice * qty;
      const itemTotalCost = dev.cost_price * qty;

      subtotalSum += itemSubtotal;
      totalCostSum += itemTotalCost;

      validatedItems.push({
        device_id: dev.id,
        brand: dev.brand,
        model: dev.model,
        storage: dev.storage,
        color: dev.color,
        imei: item.imei?.trim() || dev.imei,
        quantity: qty,
        unit_cost: dev.cost_price,
        unit_price: finalPrice,
        subtotal: itemSubtotal,
        current_stock: dev.stock_quantity,
      });
    }

    const discountAmount = Math.max(0, parseFloat(discount) || 0);
    const totalAmount = Math.max(0, subtotalSum - discountAmount);
    const now = new Date();
    const dateStr = now.toISOString();

    // Generate unique receipt number: REC-YYYYMMDD-XXXX
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countRow = queryOne<{ count: number }>(db, 'SELECT COUNT(*) as count FROM sales;');
    const seq = (countRow?.count || 0) + 1;
    const receiptNumber = `REC-${ymd}-${String(seq).padStart(4, '0')}`;

    const warrantyTerms = `Garantia legal de 90 (noventa) dias para vícios ocultos e defeitos de funcionamento, conforme Art. 26 do Código de Defesa do Consumidor (Lei 8.078/90). Não cobre quedas, contato com líquidos ou manuseio indevido.`;

    // Execute database operations
    db.run(
      `INSERT INTO sales (receipt_number, client_id, total_cost, subtotal, discount, total_amount, payment_method, installments, notes, warranty_terms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        receiptNumber,
        client_id,
        totalCostSum,
        subtotalSum,
        discountAmount,
        totalAmount,
        payment_method,
        parseInt(installments, 10) || 1,
        notes?.trim() || '',
        warrantyTerms,
        dateStr,
      ]
    );

    const saleIdRes = db.exec('SELECT last_insert_rowid();');
    const newSaleId = saleIdRes[0].values[0][0] as number;

    // Insert sale items and update stock
    for (const item of validatedItems) {
      db.run(
        `INSERT INTO sale_items (sale_id, device_id, brand, model, storage, color, imei, quantity, unit_cost, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newSaleId,
          item.device_id,
          item.brand,
          item.model,
          item.storage || '',
          item.color || '',
          item.imei || '',
          item.quantity,
          item.unit_cost,
          item.unit_price,
          item.subtotal,
        ]
      );

      // Deduct stock
      const newStock = item.current_stock - item.quantity;
      db.run('UPDATE devices SET stock_quantity = ?, updated_at = ? WHERE id = ?;', [
        newStock,
        dateStr,
        item.device_id,
      ]);

      // Record SAIDA movement
      db.run(
        `INSERT INTO stock_movements (device_id, type, quantity, previous_stock, new_stock, reason, cost_price, reference_id, notes, created_at)
         VALUES (?, 'SAIDA', ?, ?, ?, 'Venda ao cliente', ?, ?, ?, ?);`,
        [
          item.device_id,
          item.quantity,
          item.current_stock,
          newStock,
          item.unit_cost,
          receiptNumber,
          `Venda ${receiptNumber} para ${client.name}`,
          dateStr,
        ]
      );
    }

    saveDb();

    // Fetch full sale object for the receipt modal
    const fullSale = queryOne(
      db,
      `SELECT s.*,
              c.name as client_name, c.cpf as client_cpf, c.email as client_email,
              c.whatsapp as client_whatsapp, c.address as client_address,
              c.city as client_city, c.state as client_state, c.country as client_country
       FROM sales s
       JOIN clients c ON s.client_id = c.id
       WHERE s.id = ?;`,
      [newSaleId]
    );

    const saleItems = queryAll(db, 'SELECT * FROM sale_items WHERE sale_id = ?;', [newSaleId]);
    const store = queryOne(db, 'SELECT * FROM store_settings WHERE id = 1;');

    res.status(201).json({
      message: 'Venda realizada com sucesso!',
      sale: {
        ...fullSale,
        items: saleItems,
        store,
      },
    });
  } catch (error: any) {
    console.error('Error processing sale:', error);
    res.status(500).json({ error: 'Erro ao registrar venda: ' + error.message });
  }
});

// ==========================================
// STORE SETTINGS
// ==========================================
apiRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const settings = queryOne(db, 'SELECT * FROM store_settings WHERE id = 1;');
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { store_name, cnpj, phone, email, address, city, state, warranty_days } = req.body;

    db.run(
      `UPDATE store_settings
       SET store_name = ?, cnpj = ?, phone = ?, email = ?, address = ?, city = ?, state = ?, warranty_days = ?
       WHERE id = 1;`,
      [
        store_name || 'CellStore Vendas',
        cnpj || '',
        phone || '',
        email || '',
        address || '',
        city || '',
        state || '',
        parseInt(warranty_days, 10) || 90,
      ]
    );

    saveDb();

    const updated = queryOne(db, 'SELECT * FROM store_settings WHERE id = 1;');
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});
