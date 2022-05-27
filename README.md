# @uniswap/jest-environment-hardhat

[![npm](https://img.shields.io/npm/v/@uniswap/jest-environment-hardhat)](https://www.npmjs.com/package/@uniswap/jest-environment-hardhat)
[![Tests](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/test.yaml/badge.svg)](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/test.yaml)
[![Lint](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/lint.yml/badge.svg)](https://github.com/Uniswap/jest-environment-hardhat/actions/workflows/lint.yml)

A jest environment with hardhat built in.

`@uniswap/jest-environment-hardhat` is a drop-in jest environment for running hardhat inline with your tests. Instead of running a separate `hardhat node`, this environment runs a node and exposes a global `Hardhat` interface to interact with it.

## Installation

First, install `@uniswap/jest-environment-hardhat` and its dependencies using `yarn`.

The environment needs `@nomiclabs/hardhat-ethers`, `ethers`, and `hardhat` installed to run. These are installed as peer dependencies to ensure that you retain control over versioning.

```sh
yarn add -D @nomiclabs/hardhat-ethers ethers hardhat
yarn add -D @uniswap/jest-environment-hardhat
```

Then, use the runner either using a doc-comment, or using jest configuration. See the [jest documentation](https://jestjs.io/docs/configuration#testenvironment-string) for more.

`@uniswap/jest-environment-hardhat` extends a `node` environment. A `jsdom` environment is also available, using `@uniswap/jest-environment-hardhat/dist/jsdom`.

### Using a doc-comment

Files starting with a `@jest-environment` preamble use the specified runner:

```js
/**
 * @jest-environment @uniswap/jest-environment-hardhat
 */
```

### Using jest configuration

You may also configure your test environment through the `jest.config.js` file, using the [`testEnvironment`](https://jestjs.io/docs/configuration#testenvironment-string) property.

```json
  "testEnvironment": "@uniswap/jest-environment-hardhat",
```

### Subclassing your own runner

`@uniswap/jest-environment-hardhat` exports a `node` and `jsdom` environment. If you'd like to extend your own environment, you can use the setup function exported by `@uniswap/jest-environment-hardhat/setup`. See [`src/node.ts`](./src/node.ts) for an example.


## Documentation

Using the environment will expose `hardhat` on the global scope, which you can use to interact with the hardhat network in your tests.

For documentation on the hardhat global, see the [type definitions](./src/hardhat.ts).

For examples of how to interact with the hardhat network, see the [tests](./src/internal/hardhat.test.ts).

### Typescript

If you are using Typescript, you can import types by adding `import @uniswap/jest-environment-hardat` to your test file, or by adding `@uniswap/jest-environment-hardhat` types to your `tsconfig`.

---

Made with 🦄 by [Uniswap Labs](https://uniswap.org)
