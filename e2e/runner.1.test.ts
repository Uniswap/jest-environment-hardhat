/**
 * This test file exists to test that hardhat-plugin-jest runs correctly with multiple jest runners.
 * @jest-environment ./src/node.ts
 */

it('runs', (done) => {
  expect(hardhat).toBeDefined()
  setTimeout(done, 5000)
}, 10000)
