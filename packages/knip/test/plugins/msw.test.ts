import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/msw');

test('Should not see the msw files in issues', async () => {
  const { counters } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
  });

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    devDependencies: 1,
    total: 5,
    processed: 5,
  });
});
