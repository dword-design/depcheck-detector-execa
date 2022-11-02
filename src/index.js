import {
  compact,
  filter,
  flatMap,
  flatten,
  groupBy,
  join,
  keys,
  map,
  mapValues,
  split,
  uniq,
} from '@dword-design/functions'
import loadPkg from 'load-pkg'
import P from 'path'
import resolveFrom from 'resolve-from'

const getSegments = node => {
  if (
    node.callee?.object?.name === 'execa' &&
    node.callee?.property?.name === 'command'
  ) {
    switch (node.arguments[0].type) {
      case 'StringLiteral':
        return node.arguments[0].value |> split(' ')
      case 'TemplateLiteral':
        return (
          node.arguments[0].quasis
          |> map('value.raw')
          |> join(' ')
          |> split(' ')
          |> compact
        )
      default:
        return []
    }
  }
  if (node.callee?.name === 'execa') {
    return [
      ...(node.arguments[0].type === 'StringLiteral'
        ? [node.arguments[0].value]
        : []),
      ...(node.arguments[1]?.type === 'ArrayExpression'
        ? node.arguments[1].elements
          |> filter({ type: 'StringLiteral' })
          |> map('value')
        : []),
    ]
  }

  return []
}

export default (node, deps) => {
  if (node.type === 'CallExpression') {
    const segments = getSegments(node)
    if (segments.length > 0) {
      const binaryPackageMap =
        deps
        |> flatMap(dep => {
          let packageConfig
          try {
            packageConfig = require(resolveFrom(
              process.cwd(),
              `${dep}/package.json`
            ))
          } catch {
            packageConfig = loadPkg.sync(
              P.dirname(resolveFrom(process.cwd(), dep))
            )
          }

          const bin = packageConfig.bin || {}

          const binaries =
            typeof bin === 'string' ? [packageConfig.name] : bin |> keys

          return binaries |> map(binary => ({ binary, dep }))
        })
        |> groupBy('binary')
        |> mapValues(tuples => tuples |> map('dep'))

      return (
        segments
        |> map(segment => binaryPackageMap[segment])
        |> compact
        |> flatten
        |> uniq
      )
    }
  }

  return []
}
