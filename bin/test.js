/**
 * Copyright (c) 2019 The xterm.js authors. All rights reserved.
 * @license MIT
 */

const cp = require('child_process');
const path = require('path');

// Add `out` to the NODE_PATH so absolute paths can be resolved.
const env = { ...process.env };
env.NODE_PATH = path.resolve(__dirname, '../out');

const args = [
  './out/*test.js',
  './out/**/*test.js',
  './out/*integration.js',
  './out/**/*integration.js',
  './lib/**/*test.js'
];

// ability to inject particular test files via
// yarn test [testFileA testFileB ...]
const testFilesFromArgs = process.argv.slice(2);

cp.spawnSync(
  path.resolve(__dirname, '../node_modules/.bin/mocha'),
  (testFilesFromArgs.length) ? testFilesFromArgs : args,
  {
    cwd: path.resolve(__dirname, '..'),
    env,
    stdio: 'inherit'
  }
);
