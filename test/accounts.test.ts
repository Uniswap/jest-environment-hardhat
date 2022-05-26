/**
 * This test intentionally runs in the jest environment, so it will fail to link hardhat's asm dependency.
 * This is expected, and necessary to test that derived accounts match hardhat's.
 */

import hre from 'hardhat'

import { toExternallyOwnedAccounts } from '../src/accounts'

describe('toExternallyOwnedAccounts', () => {
  describe('with an HD wallet', () => {
    const HD_WALLET = {
      initialIndex: 1,
      count: 2,
      path: "m/44'/60'/0'/1",
      passphrase: 'passphrase',
      mnemonic: 'test test test test test test test test test test test junk',
      accountsBalance: '10000000000000000000000',
    }

    it('matches hardhat test addresses', async () => {
      hre.network.config.accounts = HD_WALLET
      const addresses = await hre.network.provider.send('eth_accounts', [])
      expect(addresses).toEqual(toExternallyOwnedAccounts(HD_WALLET).map(({ address }) => address))
    })
  })
})
