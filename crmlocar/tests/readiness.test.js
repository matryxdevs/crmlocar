const test = require('node:test');
const assert = require('node:assert/strict');
const { createReadiness } = require('../src/readiness');

function fakeResponse() {
  return {statusCode:200, payload:null, status(n){this.statusCode=n;return this;},json(v){this.payload=v;return this;}};
}
const silentLogger = {info(){}, error(){}};

test('API responde 503 enquanto MySQL não inicializa', () => {
  const readiness = createReadiness(async()=>{}, {logger:silentLogger});
  const response = fakeResponse();
  readiness.middleware({},response,()=>{throw Error('should not call next');});
  assert.equal(response.statusCode,503);
  assert.equal(response.payload.code,'DATABASE_NOT_READY');
  readiness.stop();
});

test('falha inicial não encerra o pool, bloqueia API e permite nova tentativa', async () => {
  let count=0;
  const readiness=createReadiness(async()=>{
    if (++count===1) throw Object.assign(new Error('Acesso negado ao banco'),{code:'ER_ACCESS_DENIED_ERROR'});
  }, {retryDelayMs:10000,logger:silentLogger});
  await readiness.attempt();
  assert.equal(readiness.state,'unavailable');
  const blocked=fakeResponse();
  readiness.middleware({},blocked,()=>{throw Error('unexpected');});
  assert.equal(blocked.statusCode,503);
  await readiness.attempt();
  assert.equal(readiness.state,'ready');
  let called=false;
  readiness.middleware({},fakeResponse(),()=>{called=true;});
  assert.equal(called,true);
  assert.equal(count,2);
  readiness.stop();
});

test('sucesso inicial libera API', async () => {
  const readiness=createReadiness(async()=>{}, {logger:silentLogger});
  await readiness.attempt();
  assert.equal(readiness.state,'ready');
  readiness.stop();
});

test('status não pronto expõe somente o código técnico sem segredos', async () => {
  const r=createReadiness(async () => { const e=new Error('Senha secreta jamais deve sair');e.code='ER_ACCESS_DENIED_ERROR';throw e; }, {retryDelayMs:10000, logger:silentLogger});
  await r.attempt();
  const resp=fakeResponse();
  r.middleware({},resp,()=>{});
  assert.equal(resp.payload.diagnosticCode,'ER_ACCESS_DENIED_ERROR');
  assert.equal(JSON.stringify(resp.payload).includes('Senha secreta'),false);
  r.stop();
});
