import NodeEnvironment from 'jest-environment-node'

import setup from './setup'

/** A node environment with hardhat built in. */
export default class HardhatNodeEnvironment extends NodeEnvironment {
  _teardown: Awaited<ReturnType<typeof setup>> = () => Promise.resolve()

  async setup() {
    await super.setup()
    this._teardown = await setup()
    this.global.hardhat = hardhat
  }

  async teardown() {
    await this._teardown()
    await super.teardown()
  }
}
