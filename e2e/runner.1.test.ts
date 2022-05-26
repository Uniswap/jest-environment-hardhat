/**
 * @jest-environment ./src/node.ts
 */

it('runs', async () => {
  expect(process.env.JEST_WORKER_ID).toBe('1')
  expect(globalThis.hardhat).toBeDefined()

  // Hang for 5 seconds to stall other tests using the same port.
  await new Promise((resolve) => setTimeout(resolve, 5000))
}, 6000)
