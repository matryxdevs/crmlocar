'use strict';
const { resolveDatabaseName } = require('./db-env');

/**
 * Registra somente metadados NÃO secretos para depurar as variáveis que
 * realmente chegaram ao processo Node.js da Hostinger. Nunca imprime senha,
 * hash ou a sua extensão.
 */
function safeDbConfigSummary(env = process.env) {
  const host = env.DB_HOST || '';
  const dbName = env.DB_NAME || '';
  const user = env.DB_USER || '';
  const password = env.DB_PASSWORD;
  const resolved = resolveDatabaseName(dbName, user);
  return {
    host,
    port: env.DB_PORT || '3306 (padrão)',
    database: dbName,
    databaseEffective: resolved.database,
    expandedHostingerPrefix: resolved.expandedHostingerPrefix,
    user,
    passwordProvided: typeof password === 'string' && password.length > 0,
    passwordHasSurroundingWhitespace: typeof password === 'string' && password !== password.trim(),
    passwordWrappedInQuotes: typeof password === 'string' && password.length >= 2 &&
      ((password.startsWith('\"') && password.endsWith('\"')) ||
       (password.startsWith("'") && password.endsWith("'"))),
    userHasSurroundingWhitespace: user !== user.trim(),
    databaseHasSurroundingWhitespace: dbName !== dbName.trim(),
    hostHasSurroundingWhitespace: host !== host.trim()
  };
}

module.exports = { safeDbConfigSummary };
