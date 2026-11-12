import { expect, it } from 'vitest';
import { ace68Keys } from '@/data/ace68-layout';

it('银羽示意配列拥有五排 68 个稳定键位，行宽一致', () => {
  expect(ace68Keys).toHaveLength(68);
  expect(new Set(ace68Keys.map(key => key.id)).size).toBe(68);
  expect([0, 1, 2, 3, 4].map(row => ace68Keys.filter(key => key.row === row).reduce((sum, key) => sum + key.width, 0))).toEqual([16, 16, 16, 16, 16]);
  expect(ace68Keys.map(key => key.label)).toEqual(expect.arrayContaining(['Ins', 'Del', 'PgUp', 'PgDn', '↑', '←', '↓', '→', 'Space']));
});
