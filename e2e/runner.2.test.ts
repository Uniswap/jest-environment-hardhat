/**
 * This test file exists to test that jest-environment-hardhat runs correctly with multiple jest runners.
 * @jest-environment ./src/jsdom.ts
 */

it('runs', (done) => {
  expect(globalThis.hardhat).toBeDefined()
  setTimeout(done, 5000)
}, 10000)
