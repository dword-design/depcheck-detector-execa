import * as t from '@babel/types';
import fs from 'fs-extra';
import { compact, groupBy, mapValues, uniq } from 'lodash-es';
import moduleRoot from 'module-root';
import parsePackagejsonName from 'parse-packagejson-name';

const getSegments = (node: t.CallExpression) => {
  if (
    t.isIdentifier(node.callee) &&
    ['execaCommand', 'execaCommandSync'].includes(node.callee.name)
  ) {
    const firstArg = node.arguments[0];

    if (t.isStringLiteral(firstArg)) {
      return firstArg.value.split(' ');
    }

    if (t.isTemplateLiteral(firstArg)) {
      return compact(
        firstArg.quasis
          .map(_ => _.value.raw)
          .join(' ')
          .split(' '),
      );
    }

    return [];
  }

  if (
    t.isIdentifier(node.callee) &&
    ['execa', 'execaSync'].includes(node.callee.name)
  ) {
    return [
      ...(t.isStringLiteral(node.arguments[0])
        ? [node.arguments[0].value]
        : []),
      ...(t.isArrayExpression(node.arguments[1])
        ? node.arguments[1].elements
            .filter(element => t.isStringLiteral(element))
            .map(element => (element as t.StringLiteral).value)
        : []),
    ];
  }

  return [];
};

export default (node: t.Node, deps: readonly string[]): string[] => {
  if (t.isCallExpression(node)) {
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
