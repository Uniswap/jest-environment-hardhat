import { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment'
import NodeEnvironment from 'jest-environment-node'

import setup from './setup'

export default class HardhatNodeEnvironment extends NodeEnvironment {
  _teardown: Awaited<ReturnType<typeof setup>> = () => Promise.resolve()

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
  }

  async setup() {
    await super.setup()
    this._teardown = await setup()
    this.global.hardhat = hardhat
  }

  async teardown() {
    await this._teardown()
    await super.teardown()
  }

  getVmContext() {
    return super.getVmContext()
  }
}
