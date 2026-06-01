/**
 * Price Alert App — Standalone Daily Cron Trigger Script
 * 
 * This script makes a secure HTTP call to the /api/cron API endpoint.
 * You can schedule this script to run once daily via:
 * - Windows Task Scheduler
 * - Crontab (Linux/macOS)
 * - GitHub Actions (Cron workflow)
 * - PM2 / Systemd
 */

const http = require('http');
const https = require('https');

// Config parameters (override via env variables)
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'dev_cron_secret';

const cronUrl = `${APP_URL}/api/cron?secret=${CRON_SECRET}`;

console.log(`[Cron Trigger] Initiating price verification call to: ${APP_URL}/api/cron`);

const client = cronUrl.startsWith('https') ? https : http;

client.get(cronUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200 && parsed.success) {
        console.log('\n--- [CRON EXECUTION SUCCESS] ---');
        console.log(`Summary: Checked ${parsed.summary.checked} products, Triggered ${parsed.summary.triggered} alerts, Failed: ${parsed.summary.failed}`);
        if (parsed.details && parsed.details.length > 0) {
          console.log('\nProcessed Details:');
          parsed.details.forEach((item) => {
            console.log(`- [${item.status}] ${item.title.slice(0, 35)}... (Was: ${item.previousPrice}, Now: ${item.newPrice})`);
          });
        }
        console.log('--------------------------------\n');
        process.exit(0);
      } else {
        console.error(`\n[Cron Trigger Error] HTTP status: ${res.statusCode}`);
        console.error('Response details:', parsed.error || data);
        process.exit(1);
      }
    } catch (err) {
      console.error('\n[Cron Trigger Error] Failed to parse response JSON:', err.message);
      console.error('Response raw:', data);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('\n[Cron Trigger Connection Error] Could not connect to Next.js API server:', err.message);
  console.error(`Ensure your Next.js application is running at ${APP_URL}`);
  process.exit(1);
});
