import 'setimmediate'

import hre from 'hardhat'
import { TASK_NODE, TASK_NODE_GET_PROVIDER, TASK_NODE_SERVER_READY } from 'hardhat/builtin-tasks/task-names'
import { HardhatNetworkAccountsConfig, JsonRpcServer } from 'hardhat/types'

import { toExternallyOwnedAccounts } from './accounts'
import { Hardhat } from './hardhat'

if (!hre.config.networks.hardhat.forking) {
  throw new Error(
    '`forking` must be specified to use jest-environment-hardhat.\nSee https://hardhat.org/hardhat-network/guides/mainnet-forking.html#mainnet-forking.'
  )
}

// Override the GET_PROVIDER task to avoid unnecessary time-intensive evm calls.
hre.tasks[TASK_NODE_GET_PROVIDER].setAction(async () => hre.network.provider)

const wallets = toExternallyOwnedAccounts(hre.network.config.accounts as HardhatNetworkAccountsConfig)
if (wallets.length > 4) {
  process.stderr.write(`${wallets.length} hardhat accounts specified - consider specifying fewer.\n`)
  process.stderr.write('Specifying multiple hardhat accounts will noticeably slow your test startup time.\n\n')
}

globalThis.hardhat = new Hardhat(hre.config.networks.localhost.url, wallets)

export default async function setup(): Promise<() => Promise<void>> {
  hre.run(TASK_NODE)
  const server = await new Promise<JsonRpcServer>((resolve) =>
    hre.tasks[TASK_NODE_SERVER_READY].setAction(async ({ server }) => resolve(server))
  )

  // Enables hardhat logging if --verbose was passed.
  if (hre.config.networks.hardhat.loggingEnabled || process.argv.includes('--verbose')) {
    await hre.network.provider.send('hardhat_setLoggingEnabled', [true])
  }

  return async () => await server.close()
}
