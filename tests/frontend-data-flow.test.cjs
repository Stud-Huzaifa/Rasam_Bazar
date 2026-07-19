const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const seed = read('scripts/seed.cjs');
const apiClient = read('apps/web/src/app/lib/api.ts');
const loginPage = read('apps/web/src/app/(auth)/login/page.tsx');

assert.match(seed, /admin@rasmbazaar\.demo/);
assert.match(seed, /customer@rasmbazaar\.demo/);
assert.match(seed, /vendor@rasmbazaar\.demo/);

assert.doesNotMatch(loginPage, /demoLogin/);
assert.doesNotMatch(loginPage, /demo-access-token/);
assert.doesNotMatch(apiClient, /demo-access-token/);
assert.doesNotMatch(apiClient, /getDemo(Response|Vendor|Admin|Category)/);

assert.match(
  apiClient,
  /headers\.set\('Authorization', `Bearer \$\{token\}`\)/,
);
assert.match(apiClient, /\/auth\/refresh/);
assert.match(apiClient, /credentials: 'include'/);
assert.match(apiClient, /Network error: could not reach the RasmBazaar API/);

console.log('Frontend data-flow regression tests passed.');
