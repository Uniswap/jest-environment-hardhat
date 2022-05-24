import 'setimmediate'

import { ExternallyOwnedAccount, Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import assert from 'assert'
import hre from 'hardhat'
import { ethers } from 'hardhat'

import { Erc20__factory } from './types'
import { AddressLike, Hardhat as IHardhat } from './types/hardhat'
import { WHALES } from './whales'

if (!ethers) {
  throw new Error(
    'hardhat-plugin-jest requires the hardhat-ethers plugin to be installed.\nSee https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#hardhat-ethers.'
  )
}

type OneOrMany<T> = T | T[]

export class Hardhat implements IHardhat {
  public readonly providers: JsonRpcProvider[]

  constructor(readonly url: string, readonly accounts: ExternallyOwnedAccount[]) {
    this.providers = accounts.map(
      (account) =>
        new Proxy(hre.ethers.provider, {
          get(target, prop) {
            switch (prop) {
              case 'listAccounts':
                return () => Promise.resolve([account.address])
              case 'getSigner':
                return () => hre.ethers.provider.getSigner(account.address)
              default:
                return Reflect.get(target, prop)
            }
          },
        })
    )
  }

  get account() {
    return this.accounts[0]
  }

  get provider() {
    return this.providers[0]
  }

  fork(blockNumber = hre.config.networks.hardhat.forking?.blockNumber) {
    return hre.network.provider.send('hardhat_reset', [
      {
        forking: { jsonRpcUrl: hre.config.networks.hardhat.forking?.url, blockNumber },
      },
    ])
  }

  async forkAndFund(address: AddressLike, amounts: OneOrMany<CurrencyAmount<Currency>>) {
    if (!Array.isArray(amounts)) return this.forkAndFund(address, [amounts])

    await hardhat.fork()
    return hardhat.fund(address, amounts)
  }

  getBalance(address: AddressLike, currencies: OneOrMany<Currency>) {
    if (!Array.isArray(currencies)) return this.getBalance(address, [currencies])[0]
    if (typeof address !== 'string') return this.getBalance(address.address, currencies)

    return currencies.map(async (currency) => {
      const balance = await (() => {
        if (currency.isNative) return hre.ethers.provider.getBalance(address)
        assert(currency.isToken)

        const token = Erc20__factory.connect(currency.address, hre.ethers.provider)
        return token.balanceOf(address)
      })()
      return CurrencyAmount.fromRawAmount(currency, balance.toString())
    })
  }

  setBalance(address: AddressLike, amounts: OneOrMany<CurrencyAmount<Currency>>, whales = WHALES) {
    return this.fund(address, amounts, whales)
  }

  fund(address: AddressLike, amounts: OneOrMany<CurrencyAmount<Currency>>, whales = WHALES) {
    if (!Array.isArray(amounts)) return this.fund(address, [amounts], whales)
    if (typeof address !== 'string') return this.fund(address.address, amounts, whales)

    const impersonations = whales.map((whale) => hre.network.provider.send('hardhat_impersonateAccount', [whale]))

    return Promise.all(
      amounts.map(async (amount) => {
        const { currency } = amount
        const balance = ethers.utils.parseUnits(amount.toExact(), currency.decimals)

        if (currency.isNative) {
          return hre.network.provider.send('hardhat_setBalance', [address, ethers.utils.hexValue(balance)])
        }
        assert(currency.isToken)

        for (let i = 0; i < whales.length; ++i) {
          await impersonations[i]
          const whale = hre.ethers.provider.getSigner(whales[i])
          try {
            const token = Erc20__factory.connect(currency.address, whale)
            await token.transfer(address, balance)
            return
          } catch (e) {
            throw new Error(`Could not fund ${amount.toExact()} ${currency.symbol} from any whales`)
          }
        }
      })
    )
  }

  approve(account: ExternallyOwnedAccount | Signer, spender: AddressLike, currencies: OneOrMany<Currency | CurrencyAmount<Currency>>) {
    if (!Array.isArray(currencies)) return this.approve(account, spender, [currencies])
    if (typeof spender !== 'string') return this.approve(account, spender.address, currencies)

    return Promise.all(currencies.map(async (currencyOrAmount) => {
      let [currency, limit] = 'currency' in currencyOrAmount ?
        [currencyOrAmount.currency, ethers.utils.parseUnits(currencyOrAmount.toExact(), currencyOrAmount.currency.decimals)] :
        [currencyOrAmount, ethers.constants.MaxUint256]
      if (currency.isNative) return
      assert(currency.isToken)

      const signer = Signer.isSigner(account) ? account : new hre.ethers.Wallet(account, hre.ethers.provider)
      const token = Erc20__factory.connect(currency.address, signer)

      const approval = await token.approve(spender, limit)
      return approval.wait()
    }))
  }

  send(method: string, params?: any[]) {
    return hre.network.provider.send(method, params)
  }
}
