import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vendas_celulares.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Enforce foreign keys and initialize tables
  dbInstance.run('PRAGMA foreign_keys = ON;');
  initTables(dbInstance);
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error persisting database to disk:', err);
  }
}

function initTables(db: Database): void {
  // Devices table
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      storage TEXT,
      color TEXT,
      imei TEXT,
      cost_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 2,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Stock movements table
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ENTRADA', 'SAIDA')),
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      cost_price REAL,
      reference_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    );
  `);

  // Clients table
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cpf TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'Brasil',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Sales table
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      total_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      installments INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      warranty_terms TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  // Sale items table
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      storage TEXT,
      color TEXT,
      imei TEXT,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );
  `);

  // Store settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY,
      store_name TEXT NOT NULL,
      cnpj TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      warranty_days INTEGER NOT NULL DEFAULT 90
    );
  `);

  // Seed store settings if empty
  const settingsRes = db.exec('SELECT COUNT(*) as count FROM store_settings;');
  const settingsCount = settingsRes[0]?.values[0]?.[0] as number;
  if (!settingsCount) {
    db.run(`
      INSERT INTO store_settings (id, store_name, cnpj, phone, email, address, city, state, warranty_days)
      VALUES (1, 'CellStore Vendas & Assistência', '34.567.890/0001-12', '(11) 98765-4321', 'contato@cellstore.com.br', 'Rua das Palmeiras, 350 - Centro', 'São Paulo', 'SP', 90);
    `);
  }

  // Seed sample devices if empty
  const devRes = db.exec('SELECT COUNT(*) as count FROM devices;');
  const devCount = devRes[0]?.values[0]?.[0] as number;
  if (!devCount) {
    const now = new Date().toISOString();
    const sampleDevices = [
      {
        brand: 'Apple',
        model: 'iPhone 15 Pro 128GB',
        storage: '128GB',
        color: 'Titânio Natural',
        imei: '358742091234567',
        cost_price: 5200.0,
        sell_price: 6890.0,
        stock: 5,
        min: 2,
      },
      {
        brand: 'Apple',
        model: 'iPhone 14 128GB',
        storage: '128GB',
        color: 'Estelar',
        imei: '356981240987654',
        cost_price: 3300.0,
        sell_price: 4390.0,
        stock: 8,
        min: 3,
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra 256GB',
        storage: '256GB',
        color: 'Cinza Titânio',
        imei: '359871023456789',
        cost_price: 5400.0,
        sell_price: 7199.0,
        stock: 4,
        min: 2,
      },
      {
        brand: 'Samsung',
        model: 'Galaxy A55 5G 128GB',
        storage: '128GB',
        color: 'Azul Escuro',
        imei: '354129876543210',
        cost_price: 1350.0,
        sell_price: 1999.0,
        stock: 12,
        min: 4,
      },
      {
        brand: 'Xiaomi',
        model: 'Redmi Note 13 Pro 5G',
        storage: '256GB',
        color: 'Midnight Black',
        imei: '867543029182736',
        cost_price: 1400.0,
        sell_price: 2099.0,
        stock: 7,
        min: 3,
      },
      {
        brand: 'Motorola',
        model: 'Moto G84 5G 256GB',
        storage: '256GB',
        color: 'Viva Magenta',
        imei: '351239847561029',
        cost_price: 980.0,
        sell_price: 1499.0,
        stock: 2, // low stock trigger
        min: 3,
      },
    ];

    for (const d of sampleDevices) {
      db.run(
        `INSERT INTO devices (brand, model, storage, color, imei, cost_price, sell_price, stock_quantity, min_stock, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [d.brand, d.model, d.storage, d.color, d.imei, d.cost_price, d.sell_price, d.stock, d.min, now, now]
      );
      // Register initial stock movement
      const lastIdRes = db.exec('SELECT last_insert_rowid();');
      const devId = lastIdRes[0].values[0][0] as number;
      db.run(
        `INSERT INTO stock_movements (device_id, type, quantity, previous_stock, new_stock, reason, cost_price, notes, created_at)
         VALUES (?, 'ENTRADA', ?, 0, ?, 'Estoque Inicial / Cadastro', ?, 'Entrada cadastral no sistema', ?);`,
        [devId, d.stock, d.stock, d.cost_price, now]
      );
    }
  }

  // Seed sample clients if empty
  const clientRes = db.exec('SELECT COUNT(*) as count FROM clients;');
  const clientCount = clientRes[0]?.values[0]?.[0] as number;
  if (!clientCount) {
    const now = new Date().toISOString();
    // Valid Brazilian CPFs for testing:
    const sampleClients = [
      {
        cpf: '52998224725',
        name: 'Carlos Eduardo Oliveira',
        email: 'carlos.oliveira@email.com',
        whatsapp: '11998761234',
        address: 'Rua Bela Cintra, 789, Apto 41',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        notes: 'Cliente preferencial, gosta da linha Apple',
      },
      {
        cpf: '01234567890', // We can replace with a mathematically valid CPF:
        // Calculation for 123.456.789-09: 12345678909
        cpfValid: '12345678909',
        name: 'Mariana Souza Santos',
        email: 'mariana.santos@email.com',
        whatsapp: '21987654321',
        address: 'Av. Atlântica, 1500',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
        notes: 'Cliente corporativa',
      },
      {
        cpfValid: '98765432100', // wait, let's use valid CPFs generated algorithmically:
        // Valid CPF: 37920491845
        cpfValid2: '37920491845',
        name: 'Rodrigo Mendonça Lima',
        email: 'rodrigo.mendonca@email.com',
        whatsapp: '31976543210',
        address: 'Rua dos Guajajaras, 450',
        city: 'Belo Horizonte',
        state: 'MG',
        country: 'Brasil',
        notes: 'Pagamento à vista via PIX',
      },
    ];

    db.run(
      `INSERT INTO clients (cpf, name, email, whatsapp, address, city, state, country, notes, created_at, updated_at)
       VALUES ('52998224725', 'Carlos Eduardo Oliveira', 'carlos.oliveira@email.com', '11998761234', 'Rua Bela Cintra, 789, Apto 41', 'São Paulo', 'SP', 'Brasil', 'Cliente preferencial', ?, ?);`,
      [now, now]
    );

    db.run(
      `INSERT INTO clients (cpf, name, email, whatsapp, address, city, state, country, notes, created_at, updated_at)
       VALUES ('12345678909', 'Mariana Souza Santos', 'mariana.santos@email.com', '21987654321', 'Av. Atlântica, 1500, Bloco B', 'Rio de Janeiro', 'RJ', 'Brasil', 'Cliente corporativa', ?, ?);`,
      [now, now]
    );

    db.run(
      `INSERT INTO clients (cpf, name, email, whatsapp, address, city, state, country, notes, created_at, updated_at)
       VALUES ('37920491845', 'Rodrigo Mendonça Lima', 'rodrigo.mendonca@email.com', '31976543210', 'Rua dos Guajajaras, 450, Centro', 'Belo Horizonte', 'MG', 'Brasil', 'Prefere aparelhos Samsung', ?, ?);`,
      [now, now]
    );
  }
}

// SQL query helper that formats results into array of objects
export function queryAll<T = any>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(db: Database, sql: string, params: SqlValue[] = []): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}
