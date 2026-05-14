const http = require('http');
const { exec } = require('child_process');

// ==========================================
// CONFIGURATION
// ==========================================
const GATEWAY_URL = 'http://localhost:3000/metrics';
const THRESHOLD_UP = 20; // Jika request dalam 10 detik terakhir lebih dari 20 -> Scale UP
const THRESHOLD_DOWN = 5; // Jika request dalam 10 detik terakhir kurang dari 5 -> Scale DOWN

const MAX_INSTANCES = 5;
const MIN_INSTANCES = 1;

let currentInstances = 1;
let isScaling = false;

// ==========================================
// LOGIC
// ==========================================
function checkMetrics() {
  if (isScaling) return; // Jangan lakukan apa-apa jika sedang proses scale

  http.get(GATEWAY_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const metrics = JSON.parse(data);
        const requests10s = metrics.loanCoreRequests10s || 0;

        console.log(`[Metrics] loan-core requests in last 10s: ${requests10s} (Current instances: ${currentInstances})`);

        let targetInstances = currentInstances;

        // Treshold UP
        if (requests10s > THRESHOLD_UP && currentInstances < MAX_INSTANCES) {
          targetInstances++;
          console.log(`🔥 Traffic Tinggi! Scaling UP loan-core menjadi ${targetInstances}...`);
        } 
        // Treshold DOWN
        else if (requests10s < THRESHOLD_DOWN && currentInstances > MIN_INSTANCES) {
          targetInstances--;
          console.log(`❄️ Traffic Rendah. Scaling DOWN loan-core menjadi ${targetInstances}...`);
        }

        // Jalankan Docker Compose jika target instance berubah
        if (targetInstances !== currentInstances) {
          isScaling = true;
          
          exec(`docker compose up --scale loan-core=${targetInstances} -d`, (err, stdout, stderr) => {
            if (err) {
              console.error(`[Error] Gagal scaling:`, err);
            } else {
              console.log(`✅ Berhasil scale ke ${targetInstances} instances.\n`, stdout);
              currentInstances = targetInstances;
            }
            
            // Cooldown 15 detik agar docker sempat startup/shutdown sebelum dicek lagi
            setTimeout(() => {
              isScaling = false;
            }, 15000);
          });
        }

      } catch (e) {
        console.error('[Error] Parsing metrics JSON:', e.message);
      }
    });

  }).on('error', (err) => {
    console.error('[Error] Tidak dapat menghubungi API Gateway:', err.message);
  });
}

console.log('==========================================');
console.log('🚀 Docker Auto-Scaler is running...');
console.log(`Threshold UP: > ${THRESHOLD_UP} req/10s`);
console.log(`Threshold DOWN: < ${THRESHOLD_DOWN} req/10s`);
console.log('==========================================');

// Cek metrics setiap 5 detik
setInterval(checkMetrics, 5000);
