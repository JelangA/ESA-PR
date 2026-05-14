 import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

// ==============================
// CONFIG
// ==============================
const LOAN_CORE_HOST = process.env.LOAN_CORE_HOST || 'loan-core';
const LOAN_CORE_PORT = process.env.LOAN_CORE_PORT || '3000';
const LOAN_CORE_URL = `http://${LOAN_CORE_HOST}:${LOAN_CORE_PORT}`;

const AUDIT_URL = process.env.AUDIT_URL || 'http://localhost:3010';
const PORT = Number(process.env.PORT || 3000);

// ==============================
// APP INIT
// ==============================
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==============================
// SIMPLE LOGGER
// ==============================
const log = (msg: string, meta?: any) => {
  console.log(JSON.stringify({
    time: new Date().toISOString(),
    service: 'api-gateway',
    message: msg,
    ...meta
  }));
};

// ==============================
// HEALTH CHECK
// ==============================
app.get('/health', async (_req, res) => {
  try {
    const loanCheck = await axios.get(LOAN_CORE_URL + '/loans/health', { timeout: 2000 })
      .then(r => ({ url: LOAN_CORE_URL, status: r.data }))
      .catch(() => ({ url: LOAN_CORE_URL, status: 'down' }));

    const audit = await axios
      .get(AUDIT_URL + '/health', { timeout: 2000 })
      .catch(() => null);

    res.json({
      status: 'ok',
      loanInstance: loanCheck,
      audit: audit?.data || 'unavailable'
    });

  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

// ==============================
// METRICS (FOR AUTOSCALER)
// ==============================
let loanCoreRequests = 0;

setInterval(() => {
  // Reset counter setiap 10 detik
  loanCoreRequests = 0;
}, 10000);

app.get('/metrics', (_req, res) => {
  res.json({
    loanCoreRequests10s: loanCoreRequests
  });
});

// ==============================
// LOAN APPLY (DELEGATED TO DOCKER DNS)
// ==============================
app.post('/api/loans/apply', async (req: Request, res: Response) => {
  const payload = req.body;
  const target = LOAN_CORE_URL;
  
  // Track request
  loanCoreRequests++;

  try {
    log('Forwarding loan request', { target });

    const r = await axios.post(
      target + '/loans/apply',
      payload,
      { timeout: 60000 }
    );

    res.json(r.data);

  } catch (err: any) {
    log('Loan service error', { target, error: err?.toString() });

    res.status(500).json({
      error: err?.toString(),
      target,
      details: err?.response?.data || null
    });
  }
});

// ==============================
// AUDIT SERVICE (NO LB)
// ==============================
app.get('/api/audit/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const r = await axios.get(
      `${AUDIT_URL}/audit/${encodeURIComponent(id)}`,
      { timeout: 5000 }
    );

    res.json(r.data);

  } catch (err: any) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'not found' });
    }

    res.status(500).json({ error: String(err) });
  }
});

// ==============================
// START SERVER
// ==============================
const server = app.listen(PORT, () => {
  log('API Gateway started', {
    port: PORT,
    loanService: LOAN_CORE_URL,
    auditService: AUDIT_URL
  });
});

// ==============================
// HANDLE STARTUP ERROR
// ==============================
server.on('error', (err) => {
  log('Startup error', { error: err });
  process.exit(1);
});

// ==============================
// GRACEFUL SHUTDOWN
// ==============================
const shutdown = (signal: string) => {
  log('Shutdown signal received', { signal });

  server.close(() => {
    log('Server closed gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    log('Force shutdown');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);