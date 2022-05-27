/**
 * This test intentionally runs in the jest environment, so it will fail to link hardhat's asm dependency.
 * This is expected, and necessary in order collect coverage.
 */

import hre from 'hardhat'
import { HardhatNetworkHDAccountsConfig } from 'hardhat/types'

import setup from './setup'

afterEach(jest.restoreAllMocks)

describe('setup', () => {
  afterAll(async () => {
    // Hang for 1 second to let any errant servers shutdown.
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  describe('ethers', () => {
    const hreWithEthers = hre as typeof hre & { ethers: any }
    const ethers = hreWithEthers.ethers

    afterAll(() => {
      hreWithEthers.ethers = ethers
    })

    it('throws if ethers is not available', async () => {
      delete hreWithEthers.ethers
      await expect(setup()).rejects.toThrowError(
        '`jest-environment-hardhat` requires the `@nomiclabs/hardhat-ethers` plugin to be installed.'
      )
    })
  })

  describe('forking', () => {
    const hardhat = hre.config.networks.hardhat
    const forking = hardhat.forking

    afterAll(() => {
      hardhat.forking = forking
    })

    it('throws if forking is not configured', async () => {
      delete hardhat.forking
      await expect(setup()).rejects.toThrowError('`forking` must be specified to use `jest-environment-hardhat`.')
    })
  })

  describe('accounts', () => {
    const hd = hre.network.config.accounts as HardhatNetworkHDAccountsConfig

    afterAll(() => {
      hd.count = 2
    })

    it('does not warn if 4 accounts are specified', async () => {
      hd.count = 4
      const warn = jest.spyOn(process.stderr, 'write')
      const teardown = await setup()
      expect(warn).not.toHaveBeenCalledWith(
        'Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n'
      )
      await teardown()
    })

    it('warns if more than 4 accounts are specified', async () => {
      hd.count = 5
      const warn = jest.spyOn(process.stderr, 'write')
      const teardown = await setup()
      expect(warn).toHaveBeenLastCalledWith(
        'Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n'
      )
      await teardown()
    })
  })

  describe('JEST_WORKER_ID', () => {
    const JEST_WORKER_ID = process.env.JEST_WORKER_ID

    afterAll(() => {
      process.env.JEST_WORKER_ID = JEST_WORKER_ID
    })

    it('starts without a JEST_WORKER_ID', async () => {
      process.env.JEST_WORKER_ID = undefined
      const teardown = await setup()
      await teardown()
    })
  })

  describe('logging', () => {
    const hardhat = hre.config.networks.hardhat
    const argv = process.argv
    let send: jest.SpyInstance

    beforeEach(() => {
      send = jest.spyOn(hre.network.provider, 'send').mockResolvedValue(undefined)
      hardhat.loggingEnabled = false
      process.argv = argv
    })

    it('does not enable logging', async () => {
      const teardown = await setup()
      expect(send).not.toHaveBeenCalled()
      await teardown()
    })

    it('enables logging with `loggingEnabled`', async () => {
      hardhat.loggingEnabled = true
      const teardown = await setup()
      expect(send).toHaveBeenCalledWith('hardhat_setLoggingEnabled', [true])
      await teardown()
    })

    it('enables logging with --verbose', async () => {
      process.argv.push('--verbose')
      const teardown = await setup()
      expect(send).toHaveBeenCalledWith('hardhat_setLoggingEnabled', [true])
      await teardown()
    })
  })
})
