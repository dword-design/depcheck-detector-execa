import { expect, test } from '@playwright/test';
import depcheck from 'depcheck';
import outputFiles, { type Files } from 'output-files';

import self from '.';

interface TestConfig {
  files: Files;
  packageName: string;
}

const tests: Record<string, Partial<TestConfig>> = {
  'bin object': {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: { bar: './dist/cli.js' },
      }),
      'src/index.js': "execa('bar')",
    },
  },
  'bin string': {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execa('foo')",
    },
  },
  'esm not exporting package.json': {
    files: {
      'node_modules/foo': {
        'package.json': JSON.stringify({
          bin: { bar: './dist/cli.js' },
          exports: './src/index.js',
          main: 'src/index.js',
          type: 'module',
        }),
        'src/index.js': '',
      },
      'src/index.js': "execa('bar')",
    },
  },
  execaCommand: {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaCommand('foo bar')",
    },
  },
  execaCommandSync: {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaCommandSync('foo bar')",
    },
  },
  execaSync: {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaSync('foo', ['bar'])",
    },
  },
  scoped: {
    files: {
      'node_modules/@bar/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: '@bar/foo',
      }),
      'src/index.js': "execa('foo')",
    },
    packageName: '@bar/foo',
  },
  'template tag: params': {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaCommand(`foo bar ${'bar'}`)",
    },
  },
  'template tag: simple': {
    files: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaCommand(`foo ${'bar'} baz`)",
    },
  },
};

for (const [name, _testConfig] of Object.entries(tests)) {
  const testConfig = { files: {}, packageName: 'foo', ..._testConfig };

  test(name, async ({}, testInfo) => {
    const cwd = testInfo.outputPath();
    await outputFiles(cwd, testConfig.files);

    const result = await depcheck(cwd, {
      detectors: [self({ cwd })],
      package: { dependencies: { [testConfig.packageName]: '^1.0.0' } },
    });

    expect(result.dependencies).toEqual([]);
  });
}
