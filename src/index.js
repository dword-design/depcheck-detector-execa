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
} from '@dword-design/functions';
import fs from 'fs-extra';
import moduleRoot from 'module-root';
import parsePackagejsonName from 'parse-packagejson-name';

const getSegments = node => {
  if (
    (node.callee?.object?.name === 'execa' &&
      ['command', 'commandSync'].includes(node.callee?.property?.name)) ||
    ['execaCommand', 'execaCommandSync'].includes(node.callee?.name)
  ) {
    switch (node.arguments[0].type) {
      case 'StringLiteral': {
        return node.arguments[0].value |> split(' ');
      }

      case 'TemplateLiteral': {
        return (
          node.arguments[0].quasis
          |> map('value.raw')
          |> join(' ')
          |> split(' ')
          |> compact
        );
      }

      default: {
        return [];
      }
    }
  }

  if (['execa', 'execaSync'].includes(node.callee?.name)) {
    return [
      ...(node.arguments[0].type === 'StringLiteral'
        ? [node.arguments[0].value]
        : []),
      ...(node.arguments[1]?.type === 'ArrayExpression'
        ? node.arguments[1].elements
          |> filter({ type: 'StringLiteral' })
          |> map('value')
        : []),
    ];
  }

  return [];
};

export default (node, deps) => {
  if (node.type === 'CallExpression') {
    const segments = getSegments(node);

    if (segments.length > 0) {
      const binaryPackageMap =
        deps
        |> flatMap(dep => {
          const packageConfig = fs.readJsonSync(
            `${moduleRoot(dep)}/package.json`,
          );

          const bin = packageConfig.bin || {};

          const binaries =
            typeof bin === 'string'
              ? [parsePackagejsonName(packageConfig.name).fullName]
              : bin |> keys;

          return binaries |> map(binary => ({ binary, dep }));
        })
        |> groupBy('binary')
        |> mapValues(tuples => tuples |> map('dep'));

      return (
        segments
        |> map(segment => binaryPackageMap[segment])
        |> compact
        |> flatten
        |> uniq
      );
    }
  }

  return [];
};
