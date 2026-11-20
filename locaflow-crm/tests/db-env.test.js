'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { getDbEnvironment, resolveDatabaseName, normalizeIdentifier } = require('../src/db-env');

const env = {
  DB_HOST:'127.0.0.1', DB_PORT:'3306', DB_NAME:'locarcrm',
  DB_USER:'u426849489_locarcrm', DB_PASSWORD:'SenhaForteNaoReal123!'
};

test('corrige nome curto da Hostinger apenas quando corresponde ao sufixo do usuário', () => {
  const config = getDbEnvironment(env);
  assert.equal(config.database, 'u426849489_locarcrm');
  assert.equal(config.expandedHostingerPrefix, true);
});

test('nome completo mantém o banco exato', () => {
  const config = getDbEnvironment({...env, DB_NAME:'u426849489_locarcrm'});
  assert.equal(config.database, 'u426849489_locarcrm');
  assert.equal(config.expandedHostingerPrefix, false);
});

test('não altera banco diferente do sufixo do usuário', () => {
  assert.deepEqual(resolveDatabaseName('outra_base','u426849489_locarcrm'),
    {requested:'outra_base',database:'outra_base',expandedHostingerPrefix:false});
});

test('não inventa nome de banco para usuário que não segue padrão Hostinger', () => {
  assert.equal(resolveDatabaseName('locarcrm','appuser').database,'locarcrm');
});

test('normaliza espaços e aspas dos identificadores não secretos', () => {
  const config = getDbEnvironment({...env, DB_NAME:' "locarcrm" ', DB_HOST:' "127.0.0.1" '});
  assert.equal(config.database, 'u426849489_locarcrm');
  assert.equal(config.host, '127.0.0.1');
  assert.equal(normalizeIdentifier(" 'example' "),'example');
});

test('não altera a senha MySQL', () => {
  const pass='  senha com espacos!  ';
  const config = getDbEnvironment({...env, DB_PASSWORD:pass});
  assert.equal(config.password,pass);
});

test('rejeita placeholder de senha MySQL', () => {
  assert.throws(() => getDbEnvironment({...env, DB_PASSWORD:'COLE_A_SENHA_DO_MYSQL'}),
    {code:'DB_CONFIG_INCOMPLETE'});
});

test('rejeita portas inválidas', () => {
  assert.throws(() => getDbEnvironment({...env,DB_PORT:'abc'}), {code:'DB_PORT_INVALID'});
});
