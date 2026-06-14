import { calculateEMI } from './emi-calculator';
import assert from 'node:assert';

function runTests() {
  console.log('Running EMI Calculator Tests...');

  // Test 1: 480000 @ 10% for 240 months
  const test1 = calculateEMI(480000, 10, 240);
  console.log(`Test 1 (480000 @ 10% for 240m): ${test1}`);
  // Expected EMI ≈ 4632.1
  assert.ok(Math.abs(test1 - 4632) < 1, `Test 1 failed. Expected ~4632, got ${test1}`);

  // Test 2: 524050 @ 10% for 240 months
  const test2 = calculateEMI(524050, 10, 240);
  console.log(`Test 2 (524050 @ 10% for 240m): ${test2}`);
  // Expected EMI ≈ 5057.17
  assert.ok(Math.abs(test2 - 5058) < 1, `Test 2 failed. Expected ~5058, got ${test2}`);

  console.log('All EMI calculation tests passed successfully.');
}

runTests();
