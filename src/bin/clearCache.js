import cache from '../cache.js';

async function clearCache() {
  await cache.clearAll();
  console.log('Cache cleared');
}

await clearCache();
process.exit(0);