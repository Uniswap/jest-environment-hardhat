import 'setimmediate'

import { JsonRpcProvider } from '@ethersproject/providers'
import hre from 'hardhat'
import { TASK_NODE, TASK_NODE_GET_PROVIDER, TASK_NODE_SERVER_READY } from 'hardhat/builtin-tasks/task-names'
import { HARDHAT_NETWORK_RESET_EVENT, HARDHAT_NETWORK_REVERT_SNAPSHOT_EVENT } from 'hardhat/internal/constants'
import { HardhatNetworkAccountsConfig, JsonRpcServer } from 'hardhat/types'

import { toExternallyOwnedAccounts } from './accounts'
import { Hardhat } from './hardhat'

/**
 * Use this setup function to subclass your own jest environment.
 *
 * @example
 * import NodeEnvironment from 'jest-environment-node'
 * import setup from 'jest-environment-hardhat/setup'
 * export default class HardhatNodeEnvironment extends NodeEnvironment {
 *   _teardown: Awaited<ReturnType<typeof setup>> = () => Promise.resolve()
 *   async setup() {
 *     await super.setup()
 *     this._teardown = await setup()
 *     this.global.hardhat = hardhat
 *   }
 *   async teardown() {
 *     await this._teardown()
 *     await super.teardown()
 *   }
 * }
 *
 * @returns teardown
 */
export default async function setup(): Promise<() => Promise<void>> {
  if (!hre.ethers) {
    throw new Error(
      '`jest-environment-hardhat` requires the `@nomiclabs/hardhat-ethers` plugin to be installed.\nSee https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html#hardhat-ethers.'
    )
  }
  if (!hre.config.networks.hardhat.forking) {
    throw new Error(
      '`forking` must be specified to use `jest-environment-hardhat`.\nSee https://hardhat.org/hardhat-network/guides/mainnet-forking.html#mainnet-forking.'
    )
  }

  // Overrides the GET_PROVIDER task to avoid unnecessary time-intensive evm calls.
  hre.tasks[TASK_NODE_GET_PROVIDER].setAction(async () => hre.network.provider)
  const id = Number(process.env.JEST_WORKER_ID)
  const port = 8545 + (Number.isNaN(id) ? 0 : id)
  const run = hre.run(TASK_NODE, { port })
  const serverReady = new Promise<{ url: string; server: JsonRpcServer }>((resolve) =>
    hre.tasks[TASK_NODE_SERVER_READY].setAction(async ({ address, port, server }) => {
      const url = 'http://' + address + ':' + port
      resolve({ url, server })
    })
  )

  // Deriving ExternallyOwnedAccounts is computationally intensive, so it is done while waiting for the server to come up.
  const wallets = toExternallyOwnedAccounts(hre.network.config.accounts as HardhatNetworkAccountsConfig)
  if (wallets.length > 4) {
    process.stderr.write(`${wallets.length} hardhat accounts specified - consider specifying fewer.\n`)
    process.stderr.write('Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n')
  }

  const { url, server } = await serverReady
  globalThis.hardhat = new Hardhat(hre, url, wallets)

  // Enables hardhat logging if --verbose was passed.
  if (hre.config.networks.hardhat.loggingEnabled || process.argv.includes('--verbose')) {
    await hre.network.provider.send('hardhat_setLoggingEnabled', [true])
  }

  hre.network.provider.prependListener(HARDHAT_NETWORK_RESET_EVENT, () => resetJsonRpcProvider(hre.ethers.provider))
  hre.network.provider.prependListener(HARDHAT_NETWORK_REVERT_SNAPSHOT_EVENT, () =>
    resetJsonRpcProvider(hre.ethers.provider)
  )

  return async () => {
    resetJsonRpcProvider(hre.ethers.provider)
    await server.close()
    await run
  }
}

/** Prevents a JsonRpcProvider from continuing to run its internal timers. */
function resetJsonRpcProvider(provider: JsonRpcProvider) {
  clearTimeout(provider._bootstrapPoll)
  provider.removeAllListeners()
}
