import JsdomEnvironment from 'jest-environment-jsdom'

import setup from './setup'

/** A jsdom environment with hardhat built in. */
export default class HardhatNodeEnvironment extends JsdomEnvironment {
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
