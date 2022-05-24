import { ExternallyOwnedAccount } from '@ethersproject/abstract-signer'
import { HDNode } from '@ethersproject/hdnode'
import { ethers } from 'hardhat'
import { HardhatNetworkAccountsConfig } from 'hardhat/types'

if (!ethers) {
  throw new Error(
    'hardhat-plugin-jest requires the hardhat-ethers plugin to be installed.\nSee https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#hardhat-ethers.'
  )
}

/** Derives ExternallyOwnedAccounts (ie private keys and addresses) from a hardhat accounts configuration. */
export function toExternallyOwnedAccounts(accounts: HardhatNetworkAccountsConfig): ExternallyOwnedAccount[] {
  if (Array.isArray(accounts)) {
    return accounts.map(({ privateKey }) => ({
      address: ethers.utils.computeAddress(privateKey),
      privateKey,
    }))
  } else {
    const { mnemonic, passphrase, path, count, initialIndex } = accounts
    const hdnode = HDNode.fromMnemonic(mnemonic, passphrase)
    const hdpath = path.endsWith('/') ? path : path + '/'
    return new Array(count)
      .fill(0)
      .map((_, i) => hdpath + (initialIndex + i).toString())
      .map((accountpath) => hdnode.derivePath(accountpath))
  }
}
