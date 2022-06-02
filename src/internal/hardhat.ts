import 'setimmediate'

import { ExternallyOwnedAccount, Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import assert from 'assert'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { AddressLike, Hardhat as IHardhat } from '../hardhat'
import { Erc20__factory } from '../types'
import { WHALES } from './whales'

type OneOrMany<T> = T | T[]

export class Hardhat implements IHardhat {
  readonly providers: JsonRpcProvider[]

  constructor(
    readonly hre: HardhatRuntimeEnvironment & { ethers: HardhatEthersHelpers },
    readonly url: string,
    readonly accounts: ExternallyOwnedAccount[]
  ) {
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

  async fork(blockNumber = this.hre.config.networks.hardhat.forking?.blockNumber): Promise<void> {
    return this.hre.network.provider.send('hardhat_reset', [
      {
        forking: { jsonRpcUrl: this.hre.config.networks.hardhat.forking?.url, blockNumber },
      },
    ])
  }

  async forkAndFund(address: AddressLike, amounts: OneOrMany<CurrencyAmount<Currency>>): Promise<void> {
    await this.fork()
    return this.fund(address, amounts)
  }

  getBalance(address: AddressLike, currencies: Currency): Promise<CurrencyAmount<Currency>>
  getBalance(address: AddressLike, currencies: Currency[]): Promise<CurrencyAmount<Currency>>[]
  getBalance(address: AddressLike, currencies: OneOrMany<Currency>): OneOrMany<Promise<CurrencyAmount<Currency>>> {
    if (!Array.isArray(currencies)) return this.getBalance(address, [currencies])[0]
    if (typeof address !== 'string') return this.getBalance(address.address, currencies)

    return currencies.map(async (currency) => {
      const balance = await (() => {
        if (currency.isNative) return this.hre.ethers.provider.getBalance(address)
        assert(currency.isToken)

        const token = Erc20__factory.connect(currency.address, this.hre.ethers.provider)
        return token.balanceOf(address)
      })()
      return CurrencyAmount.fromRawAmount(currency, balance.toString())
    })
  }

  setBalance(address: AddressLike, amounts: OneOrMany<CurrencyAmount<Currency>>, whales?: string[]) {
    return this.fund(address, amounts, whales)
  }

  async fund(address: AddressLike, amounts: OneOrMany<CurrencyAmount<Currency>>, whales = WHALES): Promise<void> {
    if (!Array.isArray(amounts)) return this.fund(address, [amounts], whales)
    if (typeof address !== 'string') return this.fund(address.address, amounts, whales)

    const impersonations = whales.map((whale) => this.hre.network.provider.send('hardhat_impersonateAccount', [whale]))

    await Promise.all(
      amounts.map(async (amount) => {
        const { currency } = amount
        const balance = this.hre.ethers.utils.parseUnits(amount.toExact(), currency.decimals)

        if (currency.isNative) {
          return this.hre.network.provider.send('hardhat_setBalance', [
            address,
            this.hre.ethers.utils.hexValue(balance),
          ])
        }
        assert(currency.isToken)

        for (let i = 0; i < whales.length; ++i) {
          await impersonations[i]
          const whale = this.hre.ethers.provider.getSigner(whales[i])
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

  async approve(
    account: ExternallyOwnedAccount | Signer,
    spender: AddressLike,
    currencies: OneOrMany<Currency | CurrencyAmount<Currency>>
  ): Promise<void> {
    if (!Array.isArray(currencies)) return this.approve(account, spender, [currencies])
    if (typeof spender !== 'string') return this.approve(account, spender.address, currencies)

    await Promise.all(
      currencies.map(async (currencyOrAmount) => {
        const [currency, limit] =
          'currency' in currencyOrAmount
            ? [
                currencyOrAmount.currency,
                this.hre.ethers.utils.parseUnits(currencyOrAmount.toExact(), currencyOrAmount.currency.decimals),
              ]
            : [currencyOrAmount, this.hre.ethers.constants.MaxUint256]
        if (currency.isNative) return
        assert(currency.isToken)

        const signer = Signer.isSigner(account)
          ? account
          : new this.hre.ethers.Wallet(account, this.hre.ethers.provider)
        const token = Erc20__factory.connect(currency.address, signer)

        const approval = await token.approve(spender, limit)
        return approval.wait()
      })
    )
  }

  send(method: string, params?: any[]) {
    return this.hre.network.provider.send(method, params)
  }
}
