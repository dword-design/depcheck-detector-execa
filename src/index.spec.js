import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import depcheck from 'depcheck'
import outputFiles from 'output-files'

import self from '.'

export default tester(
  {
    'bin object': {
      'node_modules/foo/package.json': JSON.stringify({
        bin: {
          bar: './dist/cli.js',
        },
      }),
      'src/index.js': "execa('bar')",
    },
    'bin string': {
      'node_modules/foo/package.json': endent`
    {
      "name": "foo",
      "bin": "./dist/cli.js"
    }
  `,
      'src/index.js': "execa('foo')",
    },
    command: {
      'node_modules/foo/package.json': endent`
    {
      "name": "foo",
      "bin": "./dist/cli.js"
    }
  `,
      'src/index.js': "execa.command('foo bar')",
    },
    'template tag: params': {
      'node_modules/foo/package.json': endent`
    {
      "name": "foo",
      "bin": "./dist/cli.js"
    }
  `,
      'src/index.js': "execa.command(`foo bar ${'bar'}`)",
    },
    'template tag: simple': {
      'node_modules/foo/package.json': endent`
    {
      "name": "foo",
      "bin": "./dist/cli.js"
    }
  `,
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
  ]
)
