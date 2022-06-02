import { ExternallyOwnedAccount, Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers'
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

declare global {
  // var is required to add the typing to globalThis.
  // eslint-disable-next-line no-var
  var hardhat: Hardhat

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      hardhat: Hardhat
    }
  }
}

export type AddressLike = string | { address: string }

/**
 * jest's Hardhat interface.
 * Use this to interact with the hardhat network from your tests.
 *
 * For example usage, see the tests at ./internal/hardhat.test.ts.
 */
export interface Hardhat {
  /** The JSON-RPC url to connect to the hardhat network. */
  readonly url: string

  /** The accounts configured via hardhat's {@link https://hardhat.org/hardhat-network/reference/#accounts}. */
  readonly accounts: ExternallyOwnedAccount[]
  /** The first account configured via hardhat - @see {@link accounts}. */
  readonly account: ExternallyOwnedAccount

  /** The signing providers configured via hardhat's {@link https://hardhat.org/hardhat-network/reference/#accounts}. */
  readonly providers: JsonRpcProvider[]
  /** The first signing provider configured via hardhat - @see {@link providers}. */
  readonly provider: JsonRpcProvider

  /**
   * Resets the mainnet fork.
   * @param blockNumber The blockNumber to fork. If unspecified, uses the blockNumber from hardhat.config.js.
   */
  fork(blockNumber?: number): Promise<void>
  /**
   * A convenience method to reset the mainnet fork and fund an account with ETH / ERC-20's.
   * @see {@link fork} and {@link fund}.
   */
  forkAndFund(address: AddressLike, amount: CurrencyAmount<Currency>): Promise<void>
  forkAndFund(address: AddressLike, amounts: CurrencyAmount<Currency>[]): Promise<void>

  /** Gets the balance of ETH ERC-20's held by the address. */
  getBalance(address: AddressLike, currency: Currency): Promise<CurrencyAmount<Currency>>
  getBalance(address: AddressLike, currencies: Currency[]): Promise<CurrencyAmount<Currency>>[]

  /** Attempts to fund an account with ETH or ERC-20's. @see {@link fund}. */
  setBalance(address: AddressLike, amount: CurrencyAmount<Currency>, whales?: string[]): Promise<void>
  setBalance(address: AddressLike, amounts: CurrencyAmount<Currency>[], whales?: string[]): Promise<void>

  /**
   * Attempts to fund an account with ETH / ERC-20's.
   * If amount is in ETH, funds the account directly. (NB: Hardhat initially funds test accounts with 1000 ETH.)
   * If amount is an ERC-20, attempts to transfer the amount from a list of known whales.
   * @param address The address of the account to fund.
   * @param amount If in ETH, the amount to set the balance to. If an ERC-20, the amount to transfer.
   * @param whales If set, overrides the list of known whale addresses from which to transfer ERC-20's.
   */
  fund(address: AddressLike, amount: CurrencyAmount<Currency>, whales?: string[]): Promise<void>
  fund(address: AddressLike, amounts: CurrencyAmount<Currency>[], whales?: string[]): Promise<void>

  /**
   * Approves the spender to spend currencies on behalf of an account.
   * @param account The account which owns the currency.
   * @param spender The address of the spender.
   */
  approve(
    account: ExternallyOwnedAccount | Signer,
    spender: AddressLike,
    currency: Currency | CurrencyAmount<Currency>
  ): Promise<void>
  approve(
    account: ExternallyOwnedAccount | Signer,
    spender: AddressLike,
    currencies: (Currency | CurrencyAmount<Currency>)[]
  ): Promise<void>

  /**
   * Sends messages to the hardhat network.
   * @see {@link https://hardhat.org/hardhat-network/reference/#json-rpc-methods-support} for a complete reference.
   */
  send(method: string, params?: any[]): Promise<any>

  /**
   * The hardhat runtime environment.
   * Most usage should use the wrapper methods instead of accessing hre directly.
   */
  readonly hre: HardhatRuntimeEnvironment & { ethers: HardhatEthersHelpers }
}
