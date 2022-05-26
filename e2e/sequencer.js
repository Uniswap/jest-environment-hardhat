// eslint-disable-next-line @typescript-eslint/no-var-requires
const Sequencer = require('@jest/test-sequencer').default

module.exports = class extends Sequencer {
  // Forces tests to be run in separate workers.
  sort(tests) {
    return tests.sort((a, b) => (a.path < b.path ? -1 : 1))
  }
}
