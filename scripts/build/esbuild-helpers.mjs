import { build } from 'esbuild';
import { pluginRoot } from './paths.mjs';

export const browserBuildDefaults = Object.freeze({
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2019'],
  legalComments: 'none'
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createGlobalModuleSource(globalExpression, exportNames) {
  const safeNames = exportNames.filter((name) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name));
  const exportLines = safeNames
    .map((name) => `export const ${name} = moduleValue[${JSON.stringify(name)}];`)
    .join('\n');

  return `const moduleValue = ${globalExpression};\nexport default moduleValue;\n${exportLines}\n`;
}

export async function createVirtualModulesPlugin(definitions) {
  const sources = new Map();

  for (const [moduleName, definition] of Object.entries(definitions)) {
    if (typeof definition === 'string') {
      sources.set(moduleName, definition);
      continue;
    }

    if (definition?.source) {
      sources.set(moduleName, definition.source);
      continue;
    }

    if (!definition?.globalExpression) {
      throw new Error(`Virtual module ${moduleName} has no source or global expression.`);
    }

    const importedModule = await import(moduleName);
    const exportNames = Object.keys(importedModule).filter((name) => name !== 'default');
    sources.set(moduleName, createGlobalModuleSource(definition.globalExpression, exportNames));
  }

  return {
    name: 'vrodos-virtual-modules',
    setup(buildContext) {
      for (const moduleName of sources.keys()) {
        buildContext.onResolve(
          { filter: new RegExp(`^${escapeRegExp(moduleName)}$`) },
          () => ({
            path: moduleName,
            namespace: 'vrodos-virtual-module'
          })
        );
      }

      buildContext.onLoad(
        { filter: /.*/, namespace: 'vrodos-virtual-module' },
        (args) => ({
          contents: sources.get(args.path),
          loader: 'js',
          resolveDir: pluginRoot
        })
      );
    }
  };
}

export async function buildBrowserBundle({
  entryPoint,
  outfile,
  virtualModules = {},
  plugins = [],
  ...overrides
}) {
  const virtualModuleNames = Object.keys(virtualModules);
  const virtualModulesPlugin = virtualModuleNames.length
    ? await createVirtualModulesPlugin(virtualModules)
    : null;

  return build({
    ...browserBuildDefaults,
    entryPoints: [entryPoint],
    outfile,
    ...overrides,
    plugins: [
      ...plugins,
      ...(virtualModulesPlugin ? [virtualModulesPlugin] : [])
    ]
  });
}
