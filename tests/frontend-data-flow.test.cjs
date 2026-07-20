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
const apiMain = read('apps/api/src/main.ts');
const healthController = read('apps/api/src/health/health.controller.ts');
const exceptionFilter = read(
  'apps/api/src/common/filters/api-exception.filter.ts',
);
const responseInterceptor = read(
  'apps/api/src/common/interceptors/api-response.interceptor.ts',
);
const envExample = read('.env.example');
const envProductionExample = read('.env.production.example');

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
assert.match(apiClient, /DEFAULT_TIMEOUT_MS/);
assert.match(apiClient, /refreshPromise/);
assert.match(apiClient, /put: putJson/);
assert.match(apiClient, /Network error: could not reach the RasmBazaar API/);

assert.match(envExample, /NEXT_PUBLIC_API_URL=http:\/\/localhost:3001\/api/);
assert.match(
  envProductionExample,
  /NEXT_PUBLIC_API_URL=https:\/\/your-render-api\.onrender\.com\/api/,
);

assert.doesNotMatch(apiMain, /process\.env\.NEXT_PUBLIC_API_URL/);
assert.match(apiMain, /allowedHeaders: \['Content-Type', 'Authorization'\]/);
assert.match(exceptionFilter, /success: false/);
assert.match(exceptionFilter, /timestamp: new Date\(\)\.toISOString\(\)/);
assert.match(responseInterceptor, /success: true/);
assert.match(responseInterceptor, /data/);
assert.match(healthController, /environment: process\.env\.NODE_ENV/);
assert.match(healthController, /timestamp: new Date\(\)\.toISOString\(\)/);

console.log('Frontend data-flow regression tests passed.');
