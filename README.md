# jest-environment-hardhat

[![npm](https://img.shields.io/npm/v/jest-environment-hardhat)](https://www.npmjs.com/package/jest-environment-hardhat)
[![Tests](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/test.yaml/badge.svg)](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/test.yaml)
[![Lint](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/lint.yml/badge.svg)](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/lint.yml)

A jest environment with hardhat built in.

`jest-environment-hardhat` is a drop-in jest environment for running hardhat inline with your tests. Instead of running a separate `hardhat node`, this environment runs a node and exposes a global `Hardhat` interface - with some helper utilities - to interact with it.

## Installation

First, install `jest-environment-hardhat` and its dependencies (using `yarn` or `npm`).

The environment needs `@nomiclabs/hardhat-ethers`, `ethers`, and `hardhat` installed as well. These are installed as peer dependencies to ensure that you retain control over versioning, so you'll need to install them explicitly:

```sh
yarn add -D @nomiclabs/hardhat-ethers ethers hardhat
yarn add -D jest-environment-hardhat
```

Then, set up your `hardhat.config.js` file.
You'll need to [require `@nomiclabs/hardhat-ethers` from your `hardhat.config.js` file](https://github.com/NomicFoundation/hardhat/tree/master/packages/hardhat-ethers#installation) in order to install it as a hardhat plugin.
You'll also need to [configure mainnet forking](https://hardhat.org/hardhat-network/guides/mainnet-forking#forking-from-mainnet) to set the initial state of the hardhat network within jest.

NOTE: You should set the [`accounts` field](https://hardhat.org/hardhat-network/reference#accounts) to include as few accounts as possible to reduce startup time for your tests' hardhat network.

Then, use the runner either using a doc-comment, or using jest configuration (see the [jest documentation](https://jestjs.io/docs/configuration#testenvironment-string) for details):

```
/**
 * @jest-environment hardhat
 */

test('use hardhat in this test file', () => {
  expect(hardhat).toBeDefined()
})
```

`jest-environment-hardhat` extends a `node` environment by default. A `jsdom` environment is also available, using  `hardhat/jsdom`.

```
/**
 * @jest-environment hardhat/jsdom
 */

test('use hardhat and jsdom in this test file', () => {
  expect(hardhat).toBeDefined()
  const element = document.createElement('div')
  expect(element).not.toBeNull()
})
```

### Subclassing your own runner

`jest-environment-hardhat` subclasses a `node` environment by default, and exports a `jsdom` environment under `hardhat/jsdom`.

If you'd like to extend your own environment, you can use the setup function exported by `jest-environment-hardhat/setup`. See [`src/node.ts`](./src/node.ts) for an example.

## Documentation

Using the environment will expose `hardhat` on the global scope, which you can use to interact with the hardhat network in your tests.

For documentation on the hardhat global, see the [type declarations](./src/hardhat.ts).

For examples of how to interact with the hardhat network, see the [tests](./src/internal/hardhat.test.ts).

### Typescript

If you are using Typescript, import types by importing the library in your test or setup file:

```
/**
 * @jest-environment hardhat
 */

import 'jest-environment-hardat'

test('use hardhat in this test file', () => {
  expect(hardhat).toBeDefined()
})
```

---

Made with 🦄 by [Uniswap Labs](https://uniswap.org)
