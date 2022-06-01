/**
 * DO NOT EDIT
 * This file re-exports the compiled dist/jsdom.js file.
 * It allows the environment to be specified as `hardhat/jsdom`, omitting the `dist/` directory.
 */

'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.default = void 0
var jsdom_1 = require('./dist/jsdom')
Object.defineProperty(exports, 'default', {
  enumerable: true,
  get() {
    return __importDefault(jsdom_1).default
  },
})
