import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import depcheck from 'depcheck'
import outputFiles from 'output-files'

import self from './index.js'

export default tester(
  {
    'bin different from package name': {
      'node_modules/foo/package.json': JSON.stringify({
        bin: {
          bar: './dist/cli.js',
        },
        name: 'foo',
      }),
      'src/index.js': "execaCommand('bar')",
    },
    'bin object': {
      'node_modules/foo/package.json': JSON.stringify({
        bin: {
          bar: './dist/cli.js',
        },
      }),
      'src/index.js': "execa('bar')",
    },
    'bin string': {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execa('foo')",
    },
    command: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execa.command('foo bar')",
    },
    commandSync: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execa.commandSync('foo bar')",
    },
    'esm not exporting package.json': {
      'node_modules/foo': {
        'package.json': JSON.stringify({
          bin: {
            bar: './dist/cli.js',
          },
          exports: './src/index.js',
          main: 'src/index.js',
          type: 'module',
        }),
        'src/index.js': '',
      },
      'src/index.js': "execa('bar')",
    },
    execaCommand: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaCommand('foo bar')",
    },
    execaCommandSync: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaCommandSync('foo bar')",
    },
    execaSync: {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execaSync('foo', ['bar'])",
    },
    'template tag: params': {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execa.command(`foo bar ${'bar'}`)",
    },
    'template tag: simple': {
      'node_modules/foo/package.json': JSON.stringify({
        bin: './dist/cli.js',
        name: 'foo',
      }),
      'src/index.js': "execa.command(`foo ${'bar'} baz`)",
    },
  },
  [
    {
      transform: test => async () => {
        await outputFiles(test)

        const result = await depcheck('.', {
          detectors: [self],
          package: {
            dependencies: {
              foo: '^1.0.0',
            },
          },
        })
        expect(result.dependencies).toEqual([])
      },
    },
    testerPluginTmpDir(),
  ],
)
