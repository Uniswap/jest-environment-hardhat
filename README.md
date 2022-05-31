# jest-environment-hardhat

[![npm](https://img.shields.io/npm/v/jest-environment-hardhat)](https://www.npmjs.com/package/jest-environment-hardhat)
[![Tests](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/test.yaml/badge.svg)](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/test.yaml)
[![Lint](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/lint.yml/badge.svg)](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/lint.yml)

A jest environment with hardhat built in.

`jest-environment-hardhat` is a drop-in jest environment for running hardhat inline with your tests. Instead of running a separate `hardhat node`, this environment runs a node and exposes a global `Hardhat` interface - with some helper utilities - to interact with it.

## Installation

First, install `jest-environment-hardhat` and its dependencies (using `yarn` or `npm`).

The environment needs `@nomiclabs/hardhat-ethers`, `ethers`, and `hardhat` installed as well. These are installed as peer dependencies to ensure that you retain control over versioning, so you'll need to install them explicitly.

```sh
yarn add -D @nomiclabs/hardhat-ethers ethers hardhat
yarn add -D jest-environment-hardhat
```

Then, use the runner either using a doc-comment, or using jest configuration. See the [jest documentation](https://jestjs.io/docs/configuration#testenvironment-string) for more.

```
/**
 * @jest-environment hardhat
 */

test('use hardhat in this test file', () => {
  expect(hardhat).toBeDefined()
})
```

`jest-environment-hardhat` extends a `node` environment by default. A `jsdom` environment is also available, using  `hardhat/dist/jsdom`.

```
/**
 * @jest-environment hardhat/dist/jsdom
 */

test('use hardhat and jsdom in this test file', () => {
  expect(hardhat).toBeDefined()
  const element = document.createElement('div')
  expect(element).not.toBeNull()
})
```

### Subclassing your own runner

`jest-environment-hardhat` exports a `node` (by default) and `jsdom` environment. If you'd like to extend your own environment, you can use the setup function exported by `jest-environment-hardhat/setup`. See [`src/node.ts`](./src/node.ts) for an example.

## Documentation

Using the environment will expose `hardhat` on the global scope, which you can use to interact with the hardhat network in your tests.

For documentation on the hardhat global, see the [type definitions](./src/hardhat.ts).

For examples of how to interact with the hardhat network, see the [tests](./src/internal/hardhat.test.ts).

### Typescript

If you are using Typescript, you can import types by adding `import jest-environment-hardat` to your test file, or by adding `jest-environment-hardhat` types to your `tsconfig`.

---

Made with 🦄 by [Uniswap Labs](https://uniswap.org)
