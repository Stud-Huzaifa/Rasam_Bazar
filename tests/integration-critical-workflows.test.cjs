const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const workflows = [
  ['auth and authorization', 'tests/auth-security.test.cjs'],
  ['vendor marketplace', 'tests/vendor-marketplace.test.cjs'],
  ['service request proposals', 'tests/service-request-proposal.test.cjs'],
  ['booking payment budget', 'tests/booking-payment-budget.test.cjs'],
  ['collaboration operations', 'tests/collaboration-operations.test.cjs'],
  ['planner workflow', 'tests/planner-workflow.test.cjs'],
  ['trust safety admin', 'tests/trust-safety-admin.test.cjs'],
];

for (const [name, file] of workflows) {
  const result = spawnSync(process.execPath, [file], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
    stdio: 'pipe',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  assert.equal(
    result.status,
    0,
    `Expected ${name} integration workflow (${file}) to pass`,
  );
}

console.log('Critical integration workflows passed.');
