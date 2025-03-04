import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from '../src/util/path.js';
import { execFactory } from './helpers/execKnip.js';
import { updatePos } from './helpers/index.js';

const cwd = resolve('fixtures/unresolved');

const exec = execFactory(cwd);

test('knip --reporter json', () => {
  const json = {
    files: ['src/unused.ts'],
    issues: [
      {
        file: 'src/index.ts',
        dependencies: [],
        devDependencies: [],
        optionalPeerDependencies: [],
        unlisted: [{ name: 'unresolved' }, { name: '@org/unresolved' }],
        binaries: [],
        unresolved: [{ name: './unresolved', line: 8, col: 23, pos: 403 }],
        exports: [],
        types: [],
        enumMembers: {},
        classMembers: {},
        duplicates: [],
      },
    ],
  };

  // Add line - 1 to every pos (each EOL is one more char)
  updatePos(json);

  assert.equal(exec('knip --reporter json'), JSON.stringify(json) + '\n');
});
