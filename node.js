/**
 * DO NOT EDIT
 * This file re-exports the compiled dist/node.js file.
 * It allows the environment to be specified as `hardhat/node`, omitting the `dist/` directory.
 */

'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.default = void 0
var node_1 = require('./dist/node')
Object.defineProperty(exports, 'default', {
  enumerable: true,
  get() {
    return __importDefault(node_1).default
  },
})
