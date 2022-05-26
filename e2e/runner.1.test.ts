/**
 * This test file exists to test that jest-environment-hardhat runs correctly with multiple jest runners.
 * @jest-environment ./src/node.ts
 */

it('runs', () => {
  expect(globalThis.hardhat).toBeDefined()
})
