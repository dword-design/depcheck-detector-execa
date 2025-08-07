import type { Node } from 'depcheck';
import fs from 'fs-extra';
import { compact, groupBy, mapValues, uniq } from 'lodash-es';
import moduleRoot from 'module-root';
import parsePackagejsonName from 'parse-packagejson-name';

const getSegments = (node: Node) => {
  if (['execaCommand', 'execaCommandSync'].includes(node.callee?.name)) {
    switch (node.arguments[0].type) {
      case 'StringLiteral': {
        return node.arguments[0].value.split(' ');
      }

      case 'TemplateLiteral': {
        return compact(
          node.arguments[0].quasis
            .map(_ => _.value.raw)
            .join(' ')
            .split(' '),
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
            .filter({ type: 'StringLiteral' })
            .map('value')
        : []),
    ];
  }

  return [];
};

export default (node: Node, deps: readonly string[]): string[] => {
  if (node.type === 'CallExpression') {
    const segments = getSegments(node);

    if (segments.length > 0) {
      const binaryPackageMap = mapValues(
        groupBy(
          deps.flatMap(dep => {
            const packageConfig = fs.readJsonSync(
              `${moduleRoot(dep)}/package.json`,
            );

            const bin = packageConfig.bin || {};

            const binaries =
              typeof bin === 'string'
                ? [parsePackagejsonName(packageConfig.name).fullName]
                : Object.keys(bin);

            return binaries.map(binary => ({ binary, dep }));
          }),
          'binary',
        ),
        tuples => tuples.map(_ => _.dep),
      );

      return uniq(
        compact(segments.map(segment => binaryPackageMap[segment])).flat(),
      );
    }
  }

  return [];
};
