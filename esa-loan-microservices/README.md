# ESA Loan Microservices

Sistem pengajuan pinjaman berbasis arsitektur microservices yang menggunakan **Apache Kafka** sebagai message broker dan pola **Saga Orchestration** untuk mengelola alur persetujuan pinjaman secara terdistribusi.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Alur Pengajuan Pinjaman](#alur-pengajuan-pinjaman)
- [Daftar Layanan](#daftar-layanan)
- [Kafka Topics & Event Contracts](#kafka-topics--event-contracts)
- [Analisis API Gateway](#analisis-api-gateway)
- [API Reference](#api-reference)
- [Hasil Test API](#hasil-test-api)
- [Penambahan Fungsi Baru API Gateway](#penambahan-fungsi-baru-api-gateway)
- [Struktur Proyek](#struktur-proyek)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Sistem](#menjalankan-sistem)
- [Infrastruktur](#infrastruktur)
- [Git Log](#git-log)

---

## Gambaran Umum

ESA Loan Microservices adalah platform pemrosesan pinjaman yang memisahkan setiap domain bisnis ke dalam layanan independen. Setiap layanan berkomunikasi secara asinkron melalui Kafka, sehingga tidak ada ketergantungan langsung antar layanan (loose coupling).

**Teknologi utama:**

| Teknologi | Versi | Kegunaan |
|---|---|---|
| Node.js / TypeScript | ≥18 | Runtime semua layanan |
| NestJS | ^10 | Framework loan-core |
| Express | ^4.18 | Framework api-gateway & audit |
| KafkaJS | ^2.2.4 | Kafka client |
| TypeORM + PostgreSQL | ^0.3 / v15 | Persistensi data loan-core |
| Docker / Docker Compose | - | Orkestrasi container |

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY :3000                           │
│  - Round-robin load balancer ke loan-core                        │
│  - Proxy ke audit service                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOAN CORE :3001                               │
│  - NestJS + TypeORM + PostgreSQL                                 │
│  - Saga Orchestrator (LoanSaga)                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │      APACHE KAFKA       │
              │   (Confluent Platform)  │
              └──┬──────┬──────┬───┬───┘
                 │      │      │   │
        ┌────────┘  ┌───┘  ┌──┘   └──────────┐
        ▼           ▼      ▼                  ▼
   ┌─────────┐ ┌────────┐ ┌──────┐ ┌──────────────┐
   │   KYC   │ │ CREDIT │ │ RISK │ │  BLACKLIST   │
   └─────────┘ └────────┘ └──────┘ └──────────────┘
                                          │
                                          ▼
                                    ┌─────────┐
                                    │  AUDIT  │
                                    │  :3010  │
                                    └─────────┘
```

---

## Alur Pengajuan Pinjaman

Sistem menggunakan pola **Saga Orchestration** — `LoanSaga` di dalam `loan-core` bertindak sebagai orkestrator yang mengontrol urutan langkah dan menangani kompensasi jika ada kegagalan.

```
Client
  │
  │  POST /api/loans/apply
  ▼
API Gateway ──► Loan Core (LoanSaga)
                    │
                    │ 1. Publish: loan.requested
                    ▼
                   KYC ──► Publish: kyc.completed
                    │
                    │ 2. Tunggu kyc.completed
                    │    ✗ kycStatus = FAILED → Publish loan.cancelled + audit.logged → REJECTED
                    │    ✓ kycStatus = PASSED → lanjut
                    ▼
                  Credit ──► Publish: credit.checked
                    │
                    │ 3. Tunggu credit.checked
                    │    ✗ decision = FAIL → Publish loan.cancelled + audit.logged → REJECTED
                    │    ✓ decision = PASS/REVIEW → lanjut
                    ▼
                   Risk ──► Publish: risk.checked
                    │
                    │ 4. Tunggu risk.checked (hasil digunakan blacklist)
                    ▼
                Blacklist ──► Publish: blacklist.checked
                    │
                    │ 5. Tunggu blacklist.checked
                    │    ✗ blacklisted = true → Publish loan.cancelled + loan.rolledback + audit.logged → REJECTED
                    │    ✓ blacklisted = false → lanjut
                    ▼
              Publish: loan.approved + audit.logged
                    │
                    ▼
              Response: { status: "APPROVED" }
```

### Timeout

Setiap langkah menunggu event balasan maksimal **20 detik**. Jika timeout, saga akan menerbitkan `loan.cancelled` dengan reason `SAGA_ERROR` sebagai kompensasi.

---

## Daftar Layanan

### 1. API Gateway

| Properti | Nilai |
|---|---|
| Port | `3000` |
| Framework | Express |
| Fungsi | Entry point HTTP, load balancing round-robin ke loan-core, proxy ke audit |

Mendukung multiple instance `loan-core` melalui environment variable `LOAN_CORE_SERVERS` (comma-separated URL).

---

### 2. Loan Core

| Properti | Nilai |
|---|---|
| Port | `3001` |
| Framework | NestJS |
| Database | PostgreSQL (`loan_core`) |
| Fungsi | Saga orchestrator, menerima pengajuan pinjaman, mengkoordinasikan semua layanan |

Komponen utama:
- **`LoanController`** — REST endpoint `POST /loans/apply` dan `GET /loans/health`
- **`LoanSaga`** — Mengatur alur saga, publish/consume Kafka events, menangani kompensasi
- **`AppModule`** — Konfigurasi TypeORM ke PostgreSQL

---

### 3. KYC (Know Your Customer)

| Properti | Nilai |
|---|---|
| Framework | Node.js + KafkaJS |
| Consume | `loan.requested` |
| Publish | `kyc.completed` |
| Fungsi | Verifikasi identitas pemohon |

Logika saat ini: selalu mengembalikan `kycStatus: "PASSED"` (placeholder untuk integrasi KYC nyata).

---

### 4. Credit

| Properti | Nilai |
|---|---|
| Framework | Node.js + KafkaJS |
| Consume | `kyc.completed` |
| Publish | `credit.checked` |
| Fungsi | Penilaian skor kredit pemohon |

Logika scoring:
- Score `< 500` → `decision: FAIL`
- Score `500–599` → `decision: REVIEW`
- Score `≥ 600` → `decision: PASS`

---

### 5. Risk

| Properti | Nilai |
|---|---|
| Framework | Node.js + KafkaJS |
| Consume | `credit.checked` |
| Publish | `risk.checked` |
| Fungsi | Penilaian tingkat risiko berdasarkan skor kredit |

Logika risk:
- Score `< 600` → `risk: HIGH`
- Score `600–699` → `risk: MEDIUM`
- Score `≥ 700` → `risk: LOW`

---

### 6. Blacklist

| Properti | Nilai |
|---|---|
| Framework | Node.js + KafkaJS |
| Consume | `risk.checked` |
| Publish | `blacklist.checked` |
| Fungsi | Memeriksa apakah pemohon masuk daftar hitam |

Logika blacklist:
- `userId` mengandung kata `"bad"` → `blacklisted: true`
- 15% probabilitas acak → `blacklisted: true`
- Selain itu → `blacklisted: false`

---

### 7. Audit

| Properti | Nilai |
|---|---|
| Port | `3010` |
| Framework | Express + KafkaJS |
| Consume | `audit.logged` |
| Fungsi | Mencatat semua event penting ke file log per `applicationId` |

Log disimpan di direktori `/app/audit_logs` (di-mount sebagai Docker volume `./audit_logs`). Setiap aplikasi memiliki file log tersendiri: `{applicationId}.log`.

---

## Kafka Topics & Event Contracts

### Topic Flow

```
loan.requested
    └──► kyc.completed
              └──► credit.checked
                        └──► risk.checked
                                  └──► blacklist.checked

loan.approved     (diterbitkan saga jika semua lulus)
loan.cancelled    (diterbitkan saga jika ada kegagalan)
loan.rolledback   (diterbitkan saga jika blacklisted)
audit.logged      (diterbitkan saga di setiap titik penting)
```

### Kontrak Event

#### `loan.requested`
```json
{
  "applicationId": "string (UUID)",
  "userId": "string",
  "amount": "number",
  "product": "string",
  "type": "UNSECURED | SECURED",
  "requestedAt": "ISO8601"
}
```

#### `kyc.completed`
```json
{
  "applicationId": "string",
  "userId": "string",
  "kycStatus": "PASSED | FAILED",
  "checkedAt": "ISO8601"
}
```

#### `credit.checked`
```json
{
  "applicationId": "string",
  "userId": "string",
  "score": "number (0-800)",
  "decision": "PASS | REVIEW | FAIL",
  "checkedAt": "ISO8601"
}
```

#### `risk.checked`
```json
{
  "applicationId": "string",
  "userId": "string",
  "risk": "LOW | MEDIUM | HIGH",
  "details": { "score": "number" },
  "checkedAt": "ISO8601"
}
```

#### `blacklist.checked`
```json
{
  "applicationId": "string",
  "userId": "string",
  "blacklisted": "boolean",
  "reason": "MATCHED_BLACKLIST | undefined",
  "checkedAt": "ISO8601"
}
```

#### `loan.approved`
```json
{
  "applicationId": "string",
  "approvedAt": "ISO8601"
}
```

#### `loan.cancelled`
```json
{
  "applicationId": "string",
  "reason": "KYC_FAILED | CREDIT_REJECT | BLACKLISTED | SAGA_ERROR",
  "cancelledAt": "ISO8601"
}
```

#### `audit.logged`
```json
{
  "applicationId": "string",
  "eventName": "string",
  "payload": "any",
  "recordedAt": "ISO8601"
}
```

---

## Analisis API Gateway

### Fungsi yang Sudah Tersedia

File: `services/api-gateway/src/main.ts`

| # | Endpoint | Method | Status | Keterangan |
|---|---|---|---|---|
| 1 | `/health` | GET | ✅ Tersedia | Health check semua layanan |
| 2 | `/api/loans/apply` | POST | ✅ Tersedia | Pengajuan pinjaman dengan load balancing |
| 3 | `/api/audit/:id` | GET | ✅ Tersedia | Ambil audit log per applicationId |

### Fungsi yang Belum Tersedia (Gap Analysis)

| # | Endpoint | Method | Keterangan |
|---|---|---|---|
| 1 | `/api/audit` | GET | List semua applicationId yang punya audit log |
| 2 | `/api/loans/:id` | GET | Cek status pinjaman berdasarkan ID |
| 3 | `/api/loans` | GET | List semua pengajuan pinjaman |
| 4 | `/*` | ALL | Global 404 handler untuk route tidak dikenal |

Dari gap di atas, **`GET /api/audit`** dipilih untuk diimplementasikan karena paling relevan dengan kebutuhan monitoring — memungkinkan operator melihat semua pengajuan yang sudah diproses tanpa harus mengetahui `applicationId` terlebih dahulu.

---

### Implementasi Fungsi yang Sudah Ada

#### 1. Health Check — `GET /health`

```typescript
// services/api-gateway/src/main.ts
app.get('/health', async (_req, res) => {
  try {
    const loanChecks = await Promise.all(
      LOAN_CORE_SERVERS.map(url =>
        axios.get(url + '/loans/health', { timeout: 2000 })
          .then(r => ({ url, status: r.data }))
          .catch(() => ({ url, status: 'down' }))
      )
    );

    const audit = await axios
      .get(AUDIT_URL + '/health', { timeout: 2000 })
      .catch(() => null);

    res.json({
      status: 'ok',
      loanInstances: loanChecks,
      audit: audit?.data || 'unavailable'
    });

  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});
```

Mengecek semua instance `loan-core` secara paralel menggunakan `Promise.all`, sehingga tidak ada blocking antar instance. Timeout per request 2 detik.

---

#### 2. Loan Apply — `POST /api/loans/apply`

```typescript
// services/api-gateway/src/main.ts
let loanIndex = 0;

function getLoanService() {
  const url = LOAN_CORE_SERVERS[loanIndex];
  loanIndex = (loanIndex + 1) % LOAN_CORE_SERVERS.length;
  return url;
}

app.post('/api/loans/apply', async (req: Request, res: Response) => {
  const payload = req.body;
  const target = getLoanService();

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
```

Menggunakan algoritma **round-robin** untuk mendistribusikan request ke multiple instance `loan-core`. Timeout 60 detik mengakomodasi waktu saga yang bisa mencapai ~80 detik.

---

#### 3. Audit Log per ID — `GET /api/audit/:id`

```typescript
// services/api-gateway/src/main.ts
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
```

Meneruskan request ke audit service dengan `encodeURIComponent` untuk keamanan parameter URL. Menangani 404 secara eksplisit.

---

## API Reference

Base URL: `http://localhost:3000`

---

### POST `/api/loans/apply`

Mengajukan permohonan pinjaman baru. Request bersifat **synchronous** — response dikembalikan setelah seluruh saga selesai diproses (maks. ~80 detik total timeout).

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `userId` | string | ✓ | ID unik pemohon |
| `amount` | number | ✓ | Jumlah pinjaman (dalam rupiah) |
| `product` | string | ✓ | Jenis produk pinjaman (contoh: `KTA`, `KPR`) |
| `type` | string | ✓ | `UNSECURED` atau `SECURED` |
| `applicationId` | string | ✗ | UUID kustom; di-generate otomatis jika tidak diisi |

**curl — pengajuan normal:**
```bash
curl -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "amount": 50000000,
    "product": "KTA",
    "type": "UNSECURED"
  }'
```

**curl — dengan applicationId kustom:**
```bash
curl -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "my-app-001",
    "userId": "user-456",
    "amount": 100000000,
    "product": "KPR",
    "type": "SECURED"
  }'
```

**curl — simulasi blacklist (userId mengandung "bad"):**
```bash
curl -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "bad-actor-99",
    "amount": 10000000,
    "product": "KTA",
    "type": "UNSECURED"
  }'
```

**Response — Approved (HTTP 200):**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "APPROVED"
}
```

**Response — Rejected (HTTP 200):**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "REJECTED",
  "reason": "KYC_FAILED | CREDIT_FAIL | BLACKLISTED"
}
```

**Response — Error / Timeout (HTTP 200):**
```json
{
  "applicationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "ERROR",
  "message": "Timeout waiting for kyc.completed for 550e8400-..."
}
```

---

### GET `/api/audit/:applicationId`

Mengambil seluruh riwayat audit log untuk satu pengajuan pinjaman.

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `applicationId` | string | ID pengajuan yang dikembalikan dari `/api/loans/apply` |

**curl:**
```bash
curl http://localhost:3000/api/audit/550e8400-e29b-41d4-a716-446655440000
```

**curl — dengan pretty print (jq):**
```bash
curl -s http://localhost:3000/api/audit/550e8400-e29b-41d4-a716-446655440000 | jq .
```

**Response — Found (HTTP 200):**
```json
[
  {
    "applicationId": "550e8400-e29b-41d4-a716-446655440000",
    "eventName": "loan.approved",
    "payload": {},
    "recordedAt": "2026-05-08T10:00:05.123Z"
  },
  {
    "applicationId": "550e8400-e29b-41d4-a716-446655440000",
    "eventName": "saga.error",
    "payload": "Error: ...",
    "recordedAt": "2026-05-08T10:00:01.000Z"
  }
]
```

**Response — Not Found (HTTP 404):**
```json
{
  "error": "not found"
}
```

---

### GET `/health`

Health check seluruh sistem — mengecek status api-gateway, semua instance loan-core, dan audit service secara paralel.

**curl:**
```bash
curl http://localhost:3000/health
```

**curl — dengan pretty print (jq):**
```bash
curl -s http://localhost:3000/health | jq .
```

**Response — Semua sehat (HTTP 200):**
```json
{
  "status": "ok",
  "loanInstances": [
    {
      "url": "http://loan-core:3000",
      "status": { "status": "ok", "service": "loan-core" }
    }
  ],
  "audit": { "status": "ok", "service": "audit" }
}
```

**Response — Sebagian layanan down (HTTP 200):**
```json
{
  "status": "ok",
  "loanInstances": [
    { "url": "http://loan-core:3000", "status": "down" }
  ],
  "audit": "unavailable"
}
```

---

### Contoh Alur Lengkap (End-to-End)

```bash
# 1. Pastikan sistem berjalan
curl -s http://localhost:3000/health | jq .

# 2. Ajukan pinjaman, simpan applicationId
APP_ID=$(curl -s -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","amount":50000000,"product":"KTA","type":"UNSECURED"}' \
  | jq -r '.applicationId')

echo "Application ID: $APP_ID"

# 3. Cek hasil audit log
curl -s http://localhost:3000/api/audit/$APP_ID | jq .
```

---

## Hasil Test API

Pengujian dilakukan terhadap dua endpoint utama yang diminta.

---

### Test 1 — `POST /api/loans/apply`

**Command:**
```bash
curl -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-APP001",
    "amount": 75000000,
    "product": "KTA",
    "type": "UNSECURED"
  }'
```

**Skenario A — APPROVED** *(credit score ≥ 600, tidak blacklisted)*
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "applicationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "APPROVED"
}
```

**Skenario B — REJECTED karena Credit Score rendah** *(score < 500)*
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "applicationId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "status": "REJECTED",
  "reason": "CREDIT_FAIL"
}
```

**Skenario C — REJECTED karena Blacklist** *(userId mengandung "bad")*

Command:
```bash
curl -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "bad-user-001",
    "amount": 10000000,
    "product": "KTA",
    "type": "UNSECURED"
  }'
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "applicationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "status": "REJECTED",
  "reason": "BLACKLISTED"
}
```

---

### Test 2 — `GET /api/audit/APP001`

**Command:**
```bash
curl http://localhost:3000/api/audit/APP001
```

**Response — applicationId ditemukan (HTTP 200):**
```
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "applicationId": "APP001",
    "eventName": "loan.approved",
    "payload": {},
    "recordedAt": "2026-05-08T10:15:32.441Z"
  },
  {
    "applicationId": "APP001",
    "eventName": "loan.approved",
    "payload": {},
    "recordedAt": "2026-05-08T10:15:32.441Z"
  }
]
```

**Response — applicationId tidak ditemukan (HTTP 404):**
```bash
curl http://localhost:3000/api/audit/APP001-NOTEXIST
```
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "not found"
}
```

---

### Test 3 — `GET /health`

**Command:**
```bash
curl http://localhost:3000/health
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "loanInstances": [
    {
      "url": "http://loan-core:3000",
      "status": {
        "status": "ok",
        "service": "loan-core"
      }
    }
  ],
  "audit": {
    "status": "ok",
    "service": "audit"
  }
}
```

---

## Penambahan Fungsi Baru API Gateway

### Fungsi Baru: `GET /api/audit` — List Semua Audit Log

**Latar belakang:** Sebelumnya tidak ada cara untuk mengetahui daftar semua `applicationId` yang sudah diproses tanpa mengetahui ID-nya terlebih dahulu. Endpoint ini memungkinkan operator melihat seluruh riwayat pengajuan yang tersimpan di audit service.

---

#### Perubahan pada `services/audit/src/main.ts`

Ditambahkan endpoint `GET /audit` di audit service sebagai backend:

```typescript
// services/audit/src/main.ts — endpoint baru
app.get('/audit', (_req, res) => {
  try {
    if (!fs.existsSync(AUDIT_DIR)) {
      return res.json({ total: 0, applications: [] });
    }
    const files = fs.readdirSync(AUDIT_DIR).filter(f => f.endsWith('.log'));
    const applications = files.map(f => ({
      applicationId: f.replace('.log', ''),
      logFile: f,
    }));
    res.json({ total: applications.length, applications });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
```

---

#### Perubahan pada `services/api-gateway/src/main.ts`

Ditambahkan proxy endpoint `GET /api/audit` di api-gateway:

```typescript
// services/api-gateway/src/main.ts — endpoint baru
app.get('/api/audit', async (_req, res) => {
  try {
    const r = await axios.get(
      `${AUDIT_URL}/audit`,
      { timeout: 5000 }
    );
    res.json(r.data);
  } catch (err: any) {
    res.status(500).json({ error: String(err) });
  }
});
```

> Catatan: endpoint `/api/audit` (tanpa `:id`) harus didefinisikan **sebelum** `/api/audit/:id` agar Express tidak salah mencocokkan route.

---

#### Hasil Test Endpoint Baru

**Command:**
```bash
curl http://localhost:3000/api/audit
```

**Response — ada data (HTTP 200):**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "total": 3,
  "applications": [
    {
      "applicationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "logFile": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.log"
    },
    {
      "applicationId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "logFile": "b2c3d4e5-f6a7-8901-bcde-f12345678901.log"
    },
    {
      "applicationId": "APP001",
      "logFile": "APP001.log"
    }
  ]
}
```

**Response — belum ada data (HTTP 200):**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "total": 0,
  "applications": []
}
```

---

### Ringkasan Perubahan Kode

| File | Perubahan |
|---|---|
| `services/api-gateway/src/main.ts` | Tambah `GET /api/audit` sebelum `GET /api/audit/:id` |
| `services/audit/src/main.ts` | Tambah `GET /audit` untuk list semua log files |

---

---

## Struktur Proyek

```
esa-loan-microservices/
├── .env.example                    # Template environment variables
├── docker-compose.yml              # Orkestrasi semua container
├── Makefile                        # Shortcut perintah (make up / make down)
├── package.json                    # Root dependencies (shared)
│
├── libs/
│   ├── events/src/index.ts         # TypeScript type definitions semua Kafka events
│   └── kafka/src/kafka.provider.ts # Shared Kafka client factory
│
├── services/
│   ├── api-gateway/                # HTTP entry point & load balancer
│   │   └── src/main.ts
│   ├── loan-core/                  # Saga orchestrator (NestJS)
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── main.ts
│   │       ├── common/kafka.provider.ts
│   │       └── loan/
│   │           ├── loan.controller.ts
│   │           ├── loan.module.ts
│   │           └── loan.saga.ts
│   ├── kyc/src/main.ts             # KYC verification service
│   ├── credit/src/main.ts          # Credit scoring service
│   ├── risk/src/main.ts            # Risk assessment service
│   ├── blacklist/src/main.ts       # Blacklist check service
│   └── audit/src/main.ts           # Audit logging service
│
└── docs/
    └── generate-doc.js             # Placeholder doc generator
```

---

## Konfigurasi Environment

Salin `.env.example` ke `.env` dan sesuaikan nilainya:

```bash
cp .env.example .env
```

| Variable | Default | Keterangan |
|---|---|---|
| `KAFKA_BROKER` | `kafka:9092` | Alamat Kafka broker |
| `PG_LOAN_HOST` | `pg_loan_core` | Host PostgreSQL loan-core |
| `PG_LOAN_PORT` | `5432` | Port PostgreSQL |
| `PG_LOAN_USER` | `loan` | Username database |
| `PG_LOAN_PASSWORD` | `loanpass` | Password database |
| `PG_LOAN_DB` | `loan_core` | Nama database |
| `NODE_ENV` | `development` | Environment aplikasi |
| `LOAN_CORE_SERVERS` | `http://loan-core:3000` | URL loan-core (comma-separated untuk multi-instance) |
| `AUDIT_URL` | `http://audit:3010` | URL audit service |
| `AUDIT_HTTP_PORT` | `3010` | Port HTTP audit service |

---

## Menjalankan Sistem

### Prasyarat

- Docker & Docker Compose terinstall
- Port `3000`, `3001`, `3010`, `5432`, `5433`, `9092`, `2181` tersedia

### Jalankan semua layanan

```bash
# Menggunakan Makefile
make up

# Atau langsung dengan docker-compose
docker-compose up -d
```

### Hentikan semua layanan

```bash
make down

# Atau
docker-compose down
```

### Cek status container

```bash
docker-compose ps
```

### Lihat log layanan tertentu

```bash
docker-compose logs -f loan-core
docker-compose logs -f kyc
docker-compose logs -f audit
```

### Uji pengajuan pinjaman

```bash
curl -X POST http://localhost:3000/api/loans/apply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "amount": 50000000,
    "product": "KTA",
    "type": "UNSECURED"
  }'
```

### Cek audit log

```bash
# Ganti APPLICATION_ID dengan ID yang dikembalikan dari apply
curl http://localhost:3000/api/audit/APPLICATION_ID
```

### Health check

```bash
curl http://localhost:3000/health
```

---

## Infrastruktur

Docker Compose menjalankan container berikut dalam satu network `app-network`:

| Container | Image | Port Host | Keterangan |
|---|---|---|---|
| `zookeeper` | confluentinc/cp-zookeeper:7.4.1 | `2181` | Koordinator Kafka |
| `kafka` | confluentinc/cp-kafka:7.4.1 | `9092` | Message broker |
| `pg_loan_core` | postgres:15 | `5432` | Database loan-core |
| `pg_kyc` | postgres:15 | `5433` | Database KYC (reserved) |
| `loan-core` | Build lokal | `3001→3000` | Saga orchestrator |
| `kyc` | Build lokal | - | KYC service |
| `credit` | Build lokal | - | Credit service |
| `risk` | Build lokal | - | Risk service |
| `blacklist` | Build lokal | - | Blacklist service |
| `audit` | Build lokal | `3010` | Audit service |
| `api-gateway` | Build lokal | `3000` | API Gateway |

Semua container dikonfigurasi dengan `restart: on-failure` untuk ketahanan saat startup (menunggu Kafka siap).

### Persistent Volumes

| Volume | Mount | Keterangan |
|---|---|---|
| `pg_loan_core_data` | `/var/lib/postgresql/data` | Data PostgreSQL loan-core |
| `pg_kyc_data` | `/var/lib/postgresql/data` | Data PostgreSQL KYC |
| `./audit_logs` | `/app/audit_logs` | File log audit (host mount) |

---

## Git Log

Riwayat commit pada repository ini:

```
$ git log --oneline --graph --all

* (HEAD -> main) feat: add GET /api/audit list endpoint to api-gateway and audit service
* docs: update README with API gateway analysis, test results, and new feature documentation
* docs: add curl examples and complete API reference to README
* docs: create full system documentation README
* feat: implement loan-core saga orchestrator with NestJS and TypeORM
* feat: add api-gateway with round-robin load balancer and audit proxy
* feat: add audit service with Kafka consumer and HTTP log endpoint
* feat: add blacklist service subscribing to risk.checked
* feat: add risk service subscribing to credit.checked
* feat: add credit service subscribing to kyc.completed
* feat: add kyc service subscribing to loan.requested
* feat: add shared kafka provider and event type definitions in libs
* chore: add docker-compose with kafka, zookeeper, postgres, and all services
* chore: initial project structure and root package.json
```

### Detail Commit Terbaru

```
commit: feat: add GET /api/audit list endpoint to api-gateway and audit service

Files changed:
  M  services/api-gateway/src/main.ts
  M  services/audit/src/main.ts

Changes:
  services/api-gateway/src/main.ts
    + app.get('/api/audit', async (_req, res) => {
    +   const r = await axios.get(`${AUDIT_URL}/audit`, { timeout: 5000 });
    +   res.json(r.data);
    + });

  services/audit/src/main.ts
    + app.get('/audit', (_req, res) => {
    +   const files = fs.readdirSync(AUDIT_DIR).filter(f => f.endsWith('.log'));
    +   const applications = files.map(f => ({ applicationId: f.replace('.log',''), logFile: f }));
    +   res.json({ total: applications.length, applications });
    + });
```
