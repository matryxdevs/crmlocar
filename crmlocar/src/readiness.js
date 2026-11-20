'use strict';

/**
 * Gerencia a inicialização do MySQL sem encerrar o pool enquanto o servidor
 * continua recebendo requisições. Em caso de falha, as rotas da API ficam
 * temporariamente indisponíveis e a inicialização é tentada novamente.
 */
function createReadiness(initializer, { retryDelayMs = 30000, logger = console } = {}) {
  let state = 'initializing';
  let inProgress = false;
  let retryTimer = null;
  let stopped = false;
  let lastErrorCode = null;

  async function attempt() {
    if (stopped || inProgress || state === 'ready') return;
    inProgress = true;
    try {
      await initializer();
      state = 'ready';
      lastErrorCode = null;
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      logger.info('[Crmlocar] Banco de dados inicializado e pronto para uso.');
    } catch (err) {
      state = 'unavailable';
      lastErrorCode = err.code || 'INIT_FAILED';
      // A causa real aparece nos logs da Hostinger, mas NÃO é exposta ao usuário.
      logger.error('[Crmlocar] Falha na inicialização do MySQL:', err.code || '', err.message);
      if (!stopped && !retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          void attempt();
        }, retryDelayMs);
        // Não manter o processo vivo apenas por causa deste temporizador.
        retryTimer.unref?.();
      }
    } finally {
      inProgress = false;
    }
  }

  function middleware(req, res, next) {
    if (state === 'ready') return next();
    return res.status(503).json({
      error: 'Plataforma temporariamente indisponível. Tente novamente em instantes.',
      code: 'DATABASE_NOT_READY', diagnosticCode: lastErrorCode
    });
  }

  function stop() {
    stopped = true;
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  }

  return { attempt, middleware, stop, get state() { return state; }, get lastErrorCode() { return lastErrorCode; } };
}

module.exports = { createReadiness };
