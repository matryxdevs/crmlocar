const test = require('node:test');
const assert = require('node:assert/strict');
const {safeDbConfigSummary} = require('../src/db-config-diagnostics');

test('metadados de conexão preservam usuário, banco, host e omitem a senha', () => {
  const info = safeDbConfigSummary({
    DB_HOST: '127.0.0.1', DB_PORT: '3306', DB_USER: 'u426849489_crmlocar',
    DB_NAME: 'u426849489_crmlocar', DB_PASSWORD: 'topsecret'
  });
  assert.equal(info.user, 'u426849489_crmlocar');
  assert.equal(info.database, 'u426849489_crmlocar');
  assert.equal(info.passwordProvided, true);
  assert.equal(JSON.stringify(info).includes('topsecret'), false);
});

test('mostra aspas e espaços indevidos na variável de senha', () => {
  const quoted = safeDbConfigSummary({DB_PASSWORD: '"abc123"'});
  const spaced = safeDbConfigSummary({DB_PASSWORD: 'abc123 '});
  assert.equal(quoted.passwordWrappedInQuotes, true);
  assert.equal(spaced.passwordHasSurroundingWhitespace, true);
});

test('mostra nome de usuário com espaços nos extremos', () => {
  const info = safeDbConfigSummary({DB_HOST:'127.0.0.1', DB_USER:' user ',DB_NAME:'db'});
  assert.equal(info.userHasSurroundingWhitespace,true);
});


test('diagnóstico identifica banco curto e mostra banco efetivo sem revelar senha', () => {
  const info = safeDbConfigSummary({
    DB_HOST: '127.0.0.1', DB_USER: 'u426849489_locarcrm',
    DB_NAME: 'locarcrm', DB_PASSWORD: 'never-log-this'
  });
  assert.equal(info.database, 'locarcrm');
  assert.equal(info.databaseEffective, 'u426849489_locarcrm');
  assert.equal(info.expandedHostingerPrefix, true);
  assert.equal(JSON.stringify(info).includes('never-log-this'), false);
});
