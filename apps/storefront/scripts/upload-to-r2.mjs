#!/usr/bin/env node
/**
 * Zero-dependency Cloudflare R2 Upload Script
 * Uploads all media assets directly from kitchen-bots-products to Cloudflare R2.
 * Uses Node.js built-ins with AWS S3 SigV4 authentication.
 * 
 * Usage:
 *   node scripts/upload-to-r2.mjs
 *   node scripts/upload-to-r2.mjs --force        # Force re-uploading existing files
 *   node scripts/upload-to-r2.mjs --concurrency 25
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PRODUCTS_DIR = path.resolve(ROOT_DIR, '../kitchen-bots-products');

// Load .env from ecommerce or root dir
function loadEnv(filepath) {
  if (!fs.existsSync(filepath)) return;
  const envContent = fs.readFileSync(filepath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      const cleanKey = key.trim();
      if (!process.env[cleanKey]) {
        process.env[cleanKey] = val;
      }
    }
  }
}

loadEnv(path.join(ROOT_DIR, '.env'));
loadEnv(path.join(ROOT_DIR, '..', '.env'));

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.error('\n❌ Missing Cloudflare R2 credentials in environment or .env file!');
  console.error('Please configure the following in .env:');
  console.error('  R2_ACCOUNT_ID=your_cloudflare_account_id');
  console.error('  R2_ACCESS_KEY_ID=your_r2_access_key_id');
  console.error('  R2_SECRET_ACCESS_KEY=your_r2_secret_access_key');
  console.error('  R2_BUCKET_NAME=your_r2_bucket_name\n');
  process.exit(1);
}

const HOST = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const REGION = 'auto';
const SERVICE = 's3';

const MIME_TYPES = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
  '.gif': 'image/gif',
  '.glb': 'model/gltf-binary',
  '.svpj': 'application/octet-stream',
};

function hmac(key, data, encoding) {
  return crypto.createHmac('sha256', key).update(data).digest(encoding);
}

function sha256(data, encoding = 'hex') {
  return crypto.createHash('sha256').update(data).digest(encoding);
}

function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

function rfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function checkObjectExists(s3Key, expectedSize) {
  return new Promise((resolve) => {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const encodedKey = s3Key.split('/').map(rfc3986).join('/');
    const canonicalUri = `/${BUCKET_NAME}/${encodedKey}`;
    const payloadHash = sha256('');

    const canonicalHeaders = `host:${HOST}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = ['HEAD', canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, sha256(canonicalRequest)].join('\n');

    const signingKey = getSigningKey(SECRET_ACCESS_KEY, dateStamp, REGION, SERVICE);
    const signature = hmac(signingKey, stringToSign, 'hex');
    const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request({
      hostname: HOST,
      port: 443,
      path: canonicalUri,
      method: 'HEAD',
      headers: {
        'Host': HOST,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authHeader
      }
    }, (res) => {
      if (res.statusCode === 200) {
        const remoteSize = parseInt(res.headers['content-length'] || '0', 10);
        resolve(remoteSize === expectedSize);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

function uploadFile(localPath, s3Key, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = sha256(fileData);
    const encodedKey = s3Key.split('/').map(rfc3986).join('/');
    const canonicalUri = `/${BUCKET_NAME}/${encodedKey}`;

    const canonicalHeaders = `host:${HOST}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256(canonicalRequest)
    ].join('\n');

    const signingKey = getSigningKey(SECRET_ACCESS_KEY, dateStamp, REGION, SERVICE);
    const signature = hmac(signingKey, stringToSign, 'hex');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request({
      hostname: HOST,
      port: 443,
      path: canonicalUri,
      method: 'PUT',
      headers: {
        'Host': HOST,
        'Content-Type': contentType,
        'Content-Length': fileData.length,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authHeader
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          const err = new Error(`HTTP ${res.statusCode} ${res.statusMessage}: ${body}`);
          if (retryCount < 3) {
            setTimeout(() => {
              uploadFile(localPath, s3Key, retryCount + 1).then(resolve).catch(reject);
            }, 1000 * Math.pow(2, retryCount));
          } else {
            reject(err);
          }
        }
      });
    });

    req.on('error', (err) => {
      if (retryCount < 3) {
        setTimeout(() => {
          uploadFile(localPath, s3Key, retryCount + 1).then(resolve).catch(reject);
        }, 1000 * Math.pow(2, retryCount));
      } else {
        reject(err);
      }
    });

    req.write(fileData);
    req.end();
  });
}

function collectFiles(dir, baseDir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Ignore symlinks to prevent duplicate uploads
    if (entry.isSymbolicLink()) continue;
    if (entry.name.startsWith('.') || entry.name === 'Thumbs.db') continue;

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const size = fs.statSync(fullPath).size;
      results.push({ fullPath, relPath, size });
    }
  }
  return results;
}

async function main() {
  const isForce = process.argv.includes('--force');
  const concurrencyArgIdx = process.argv.indexOf('--concurrency');
  const CONCURRENCY = concurrencyArgIdx !== -1 ? parseInt(process.argv[concurrencyArgIdx + 1], 10) : 25;

  console.log(`\n======================================================`);
  console.log(`🚀 Kitchen Bots R2 Uploader (Single Source of Truth)`);
  console.log(`======================================================`);
  console.log(`📂 Source Directory : ${PRODUCTS_DIR}`);
  console.log(`🪣 Target R2 Bucket : ${BUCKET_NAME}`);
  console.log(`⚡ Concurrency      : ${CONCURRENCY} parallel streams`);
  console.log(`🔄 Mode             : ${isForce ? 'Force Overwrite' : 'Smart Delta (skip existing)'}`);
  console.log(`------------------------------------------------------`);

  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.error(`\n❌ Error: Products directory not found at: ${PRODUCTS_DIR}`);
    process.exit(1);
  }

  const files = collectFiles(PRODUCTS_DIR, PRODUCTS_DIR);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

  console.log(`📦 Found ${files.length} files (${totalMB} MB) to process.\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let uploadedBytes = 0;
  const startTime = Date.now();

  async function worker(queue) {
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        if (!isForce) {
          const exists = await checkObjectExists(item.relPath, item.size);
          if (exists) {
            skipped++;
            printProgress();
            continue;
          }
        }

        await uploadFile(item.fullPath, item.relPath);
        uploaded++;
        uploadedBytes += item.size;
        printProgress();
      } catch (err) {
        failed++;
        console.error(`\n❌ Failed [${item.relPath}]: ${err.message}`);
      }
    }
  }

  function printProgress() {
    const processed = uploaded + skipped + failed;
    const pct = ((processed / files.length) * 100).toFixed(1);
    const elapsedSec = (Date.now() - startTime) / 1000;
    const mbUploaded = (uploadedBytes / (1024 * 1024)).toFixed(1);
    const speed = elapsedSec > 0 ? (uploadedBytes / (1024 * 1024) / elapsedSec).toFixed(2) : '0.00';
    process.stdout.write(
      `\r⏳ [${pct}%] ${processed}/${files.length} done | ` +
      `Uploaded: ${uploaded} (${mbUploaded}MB @ ${speed}MB/s) | ` +
      `Skipped: ${skipped} | Failed: ${failed}`
    );
  }

  const queue = [...files];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\n======================================================`);
  console.log(`🎉 Sync Complete in ${durationSec}s!`);
  console.log(`   - Uploaded : ${uploaded} files (${(uploadedBytes / (1024 * 1024)).toFixed(1)} MB)`);
  console.log(`   - Skipped  : ${skipped} files (already up to date)`);
  console.log(`   - Failed   : ${failed} files`);
  console.log(`======================================================\n`);
  console.log(`CDN Base URL: ${process.env.VITE_CDN_URL || 'https://pub-a4b0711cb441484fbb54bc792d2312b5.r2.dev'}`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
