import NodeEnvironment from 'jest-environment-node'

import { setup, teardown } from './'

export default class HardhatNodeEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context)
  }

  async setup() {
    await super.setup()
    await setup()
    this.global.hardhat = hardhat
  }

  async teardown() {
    await teardown()
    await super.teardown()
  }

  getVmContext() {
    return super.getVmContext()
  }
}
