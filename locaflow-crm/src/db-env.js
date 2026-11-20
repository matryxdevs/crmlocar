'use strict';

// O hPanel pode fornecer nomes completos (u123456789_meubanco), mas alguns
// usuários inserem apenas o sufixo. Corrigir SOMENTE quando o usuário MySQL
// tem esse mesmo sufixo: assim não alteramos nomes de bancos arbitrariamente.
function normalizeIdentifier(value) {
  let result = String(value || '').trim();
  if (result.length >= 2 && ((result[0] === '"' && result.at(-1) === '"') || (result[0] === "'" && result.at(-1) === "'"))) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

function resolveDatabaseName(dbName, dbUser) {
  const requested = normalizeIdentifier(dbName);
  const user = normalizeIdentifier(dbUser);
  const match = /^u\d{6,}_([a-z0-9_]+)$/i.exec(user);
  if (match && requested.toLowerCase() === match[1].toLowerCase()) {
    return { requested, database: user, expandedHostingerPrefix: true };
  }
  return { requested, database: requested, expandedHostingerPrefix: false };
}

function getDbEnvironment(env = process.env) {
  const host = normalizeIdentifier(env.DB_HOST);
  const user = normalizeIdentifier(env.DB_USER);
  const password = env.DB_PASSWORD;
  const resolution = resolveDatabaseName(env.DB_NAME, user);
  const missing = [];
  if (!host) missing.push('DB_HOST');
  if (!user) missing.push('DB_USER');
  if (!password || /^(?:COLE_|COLOQUE_|SUA_SENHA|SENHA_REAL)/i.test(password)) missing.push('DB_PASSWORD');
  if (!resolution.database) missing.push('DB_NAME');
  if (missing.length) {
    const error = new Error(`Variáveis MySQL ausentes ou com valores de exemplo: ${missing.join(', ')}.`);
    error.code = 'DB_CONFIG_INCOMPLETE';
    throw error;
  }
  const port = Number(env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('DB_PORT inválida. Use 3306 para o MySQL local da Hostinger.');
    error.code = 'DB_PORT_INVALID';
    throw error;
  }
  return {
    host, port, user, password, database: resolution.database,
    dbNameRequested: resolution.requested,
    expandedHostingerPrefix: resolution.expandedHostingerPrefix
  };
}

module.exports = { normalizeIdentifier, resolveDatabaseName, getDbEnvironment };
