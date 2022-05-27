/**
 * This test intentionally runs in the jest environment, so it will fail to link hardhat's asm dependency.
 * This is expected, and necessary in order to collect coverage and test that derived accounts match hardhat's.
 */

import hre from 'hardhat'

import { toExternallyOwnedAccounts } from './accounts'

describe('toExternallyOwnedAccounts', () => {
  describe('with an HD wallet', () => {
    const ACCOUNTS = {
      initialIndex: 1,
      count: 2,
      path: "m/44'/60'/0'/1",
      passphrase: 'passphrase',
      mnemonic: 'test test test test test test test test test test test junk',
      accountsBalance: '10000000000000000000000',
    }

    it('matches hardhat test addresses', async () => {
      hre.network.config.accounts = ACCOUNTS
      const addresses = await hre.network.provider.send('eth_accounts', [])
      expect(addresses).toEqual(toExternallyOwnedAccounts(ACCOUNTS).map(({ address }) => address))
    })

    it('ignores trailing slash', () => {
      expect(toExternallyOwnedAccounts(ACCOUNTS)).toEqual(
        toExternallyOwnedAccounts({ ...ACCOUNTS, path: ACCOUNTS.path + '/' })
      )
    })
  })

  describe('with private keys', () => {
    const ACCOUNTS = [
      {
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        balance: '10000000000000000000000',
      },
      {
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        balance: '10000000000000000000000',
      },
    ]
    const ADDRESSES = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8']

    it('derives the public addresses', async () => {
      expect(ADDRESSES).toEqual(toExternallyOwnedAccounts(ACCOUNTS).map(({ address }) => address))
    })
  })
})
