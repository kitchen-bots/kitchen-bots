#!/usr/bin/env node
/**
 * Convenience wrapper to run catalog synchronization from kitchen-bots-ecommerce.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetScript = path.resolve(__dirname, '..', '..', 'kitchen-bots-dashboard', 'scripts', 'sync-catalog.mjs');

await import(`file://${targetScript.replace(/\\/g, '/')}`);
