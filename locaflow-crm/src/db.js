const mysql = require('mysql2/promise');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { getDbEnvironment } = require('./db-env');

function getConfig() {
  const settings = getDbEnvironment();
  if (settings.expandedHostingerPrefix) {
    console.warn(`[Crmlocar] DB_NAME abreviado ("${settings.dbNameRequested}"). Usando banco MySQL completo "${settings.database}". Corrija a variável DB_NAME no hPanel para evitar dependência deste ajuste.`);
  }
  return {
    host: settings.host,
    port: settings.port,
    user: settings.user,
    password: settings.password,
    database: settings.database,
    waitForConnections: true,
    connectionLimit: 8,
    connectTimeout: 12000,
    charset: 'utf8mb4',
    dateStrings: true,
    decimalNumbers: true,
    timezone: 'Z'
  };
}

let pool;
function db() {
  if (!pool) pool = mysql.createPool(getConfig());
  return pool;
}
async function initDatabase() {
  const connection = await db().getConnection();
  try {
    await connection.query('SELECT 1');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
    // DDL simples. Divide as instruções por ponto-e-vírgula; não há procedures/triggers.
    const statements = sql.replace(/^--[^\n]*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        const table = statement.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-z_]+)/i)?.[1] || 'desconhecida';
        const failure = new Error(`Falha ao criar/verificar tabela ${table}: ${err.message}`);
        failure.code = err.code;
        throw failure;
      }
    }
    const [rows] = await connection.query("SELECT COUNT(*) AS total FROM users WHERE role = 'superadmin'");
    if (!rows[0].total) {
      const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const password = process.env.ADMIN_PASSWORD || '';
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || /^(?:DEFINA_|SUA_SENHA|COLE_|CRIE_)/i.test(password)) {
        const err = new Error('Não existe superadministrador. Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) nas variáveis de ambiente para criar o primeiro acesso.');
        err.code = 'ADMIN_NOT_CONFIGURED';
        throw err;
      }
      const hash = await bcrypt.hash(password, 12);
      await connection.query('INSERT INTO users (company_id,full_name,email,password_hash,role) VALUES (NULL,?,?,?,?)', ['Administrador Crmlocar',email,hash,'superadmin']);
      console.log(`Superadministrador inicial criado: ${email}. Remova ADMIN_PASSWORD do ambiente e altere a senha após acessar.`);
    }
  } finally { connection.release(); }
}
module.exports = { db, initDatabase };
