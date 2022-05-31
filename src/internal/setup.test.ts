/**
 * This test intentionally runs in the jest environment, so it will fail to link hardhat's asm dependency.
 * This is expected, and necessary in order collect coverage.
 */

import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import { resetHardhatContext } from 'hardhat/plugins-testing'
import { HardhatNetworkHDAccountsConfig, HardhatRuntimeEnvironment } from 'hardhat/types'

let hre: HardhatRuntimeEnvironment & { ethers: HardhatEthersHelpers }
let setup: () => Promise<() => Promise<void>>
beforeEach(async () => {
  resetHardhatContext()
  jest.resetModules()
  hre = (await import('hardhat')).default as typeof hre
  setup = (await import('./setup')).default
})
afterEach(jest.restoreAllMocks)

describe('setup', () => {
  it('throws if ethers is not available', async () => {
    delete hre.ethers
    await expect(setup()).rejects.toThrowError(
      '`jest-environment-hardhat` requires the `@nomiclabs/hardhat-ethers` plugin to be installed.'
    )
  })

  it('throws if forking is not configured', async () => {
    delete hre.config.networks.hardhat.forking
    await expect(setup()).rejects.toThrowError('`forking` must be specified to use `jest-environment-hardhat`.')
  })

  describe('accounts', () => {
    let teardown: () => Promise<void> | undefined
    afterEach(async () => teardown?.())

    it('does not warn if 4 accounts are specified', async () => {
      ;(hre.network.config.accounts as HardhatNetworkHDAccountsConfig).count = 4
      const warn = jest.spyOn(process.stderr, 'write')
      teardown = await setup()
      expect(warn).not.toHaveBeenCalledWith(
        'Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n'
      )
    })

    it('warns if more than 4 accounts are specified', async () => {
      ;(hre.network.config.accounts as HardhatNetworkHDAccountsConfig).count = 5
      const warn = jest.spyOn(process.stderr, 'write')
      teardown = await setup()
      expect(warn).toHaveBeenCalledWith(
        'Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n'
      )
    })
  })

  describe('JEST_WORKER_ID', () => {
    let teardown: () => Promise<void> | undefined
    afterEach(async () => teardown?.())

    const { JEST_WORKER_ID } = process.env
    afterAll(() => {
      process.env.JEST_WORKER_ID = JEST_WORKER_ID
    })

    it('starts without a JEST_WORKER_ID', async () => {
      delete process.env.JEST_WORKER_ID
      teardown = await setup()
    })
  })

  describe('logging', () => {
    let teardown: () => Promise<void> | undefined
    afterEach(async () => teardown?.())

    const { argv } = process
    let send: jest.SpyInstance
    beforeEach(() => {
      hre.config.networks.hardhat.loggingEnabled = false
      process.argv = ['']
      send = jest.spyOn(hre.network.provider, 'send').mockResolvedValue(undefined)
    })
    afterEach(() => {
      process.argv = argv
    })

    it('does not enable logging', async () => {
      teardown = await setup()
      expect(send).not.toHaveBeenCalled()
    })

    it('enables logging with `loggingEnabled`', async () => {
      hre.config.networks.hardhat.loggingEnabled = true
      teardown = await setup()
      expect(send).toHaveBeenCalledWith('hardhat_setLoggingEnabled', [true])
    })

    it('enables logging with --verbose', async () => {
      process.argv = ['--verbose']
      teardown = await setup()
      expect(send).toHaveBeenCalledWith('hardhat_setLoggingEnabled', [true])
    })
  })

  describe('ethers listeners', () => {
    let setTimeout: jest.SpyInstance
    let clearTimeout: jest.SpyInstance
    let setInterval: jest.SpyInstance
    let clearInterval: jest.SpyInstance
    let teardown: () => Promise<void> | undefined

    beforeEach(async () => {
      jest.useFakeTimers({ advanceTimers: true } as any)
      setTimeout = jest.spyOn(global, 'setTimeout')
      clearTimeout = jest.spyOn(global, 'clearTimeout')
      setInterval = jest.spyOn(global, 'setInterval')
      clearInterval = jest.spyOn(global, 'clearInterval')

      teardown = await setup()
    })

    afterEach(async () => {
      setTimeout.mockClear()
      setInterval.mockClear()
      hardhat.provider.on('block', () => undefined)
      const timeouts = setTimeout.mock.results.map(({ value }) => value)
      const intervals = setInterval.mock.results.map(({ value }) => value)
      expect(hardhat.provider.polling).toBeTruthy()

      await teardown()
      expect(hardhat.provider.polling).toBeFalsy()
      timeouts.forEach((timer) => expect(clearTimeout).toHaveBeenCalledWith(timer))
      intervals.forEach((timer) => expect(clearInterval).toHaveBeenCalledWith(timer))

      jest.restoreAllMocks()
      jest.useRealTimers()
    })

    it('clear timers on teardown', () => undefined)

    it('clear timers on fork', async () => {
      setTimeout.mockClear()
      setInterval.mockClear()

      // JsonRpcProvider._bootstrapPoll resets itself after a 0ms timeout.
      // Because we await for the fork, we must emulate that with a tick to capture the correct timer.
      setTimeout.mockImplementationOnce(setImmediate)
      hardhat.provider.on('block', () => undefined)
      expect(setTimeout).toHaveBeenCalledTimes(1)
      expect(setTimeout.mock.lastCall[1]).toBe(0)
      setTimeout.mockClear()
      jest.runAllTicks()

      const timeouts: NodeJS.Timer[] = setTimeout.mock.results.map(({ value }) => value).filter(Boolean)
      const intervals: NodeJS.Timer[] = setInterval.mock.results.map(({ value }) => value)
      expect(hardhat.provider.polling).toBeTruthy()

      await hardhat.fork()
      expect(hardhat.provider.polling).toBeFalsy()
      timeouts.forEach((timer) => expect(clearTimeout).toHaveBeenCalledWith(timer))
      intervals.forEach((timer) => expect(clearInterval).toHaveBeenCalledWith(timer))
    })

    it('clear timers on revert', async () => {
      setTimeout.mockClear()
      setInterval.mockClear()

      // JsonRpcProvider._bootstrapPoll resets itself after a 0ms timeout.
      // Because we await for the fork, we must emulate that with tick to capture the correct timer.
      setTimeout.mockImplementationOnce(setImmediate)
      hardhat.provider.on('block', () => undefined)
      expect(setTimeout).toHaveBeenCalledTimes(1)
      expect(setTimeout.mock.lastCall[1]).toBe(0)
      setTimeout.mockClear()
      jest.runAllTicks()

      const timeouts: NodeJS.Timer[] = setTimeout.mock.results.map(({ value }) => value).filter(Boolean)
      const intervals: NodeJS.Timer[] = setInterval.mock.results.map(({ value }) => value)
      expect(hardhat.provider.polling).toBeTruthy()

      const id = await hardhat.send('evm_snapshot', [])
      await hardhat.send('evm_revert', [id])
      expect(hardhat.provider.polling).toBeFalsy()
      timeouts.forEach((timer) => expect(clearTimeout).toHaveBeenCalledWith(timer))
      intervals.forEach((timer) => expect(clearInterval).toHaveBeenCalledWith(timer))
    })
  })
})
