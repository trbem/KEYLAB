import { describe, expect, it } from 'vitest';
import { parse } from 'csv-parse/sync';
import { normalizeProsettingsEarphones, normalizeProsettingsSummaries } from '../scripts/prosettings-normalize.mjs';
import { validateCsv } from '../scripts/data-validation.mjs';

const header = 'player,display_name,games,Monitor,Mouse,Keyboard,Headset,Mousepad';

describe('ProSettings 汇总数据本地整理', () => {
  it('保留跨游戏选手的不同配置，不推断来源和核验日期', () => {
    const inputs = [
      { game: 'cs2', filename: 'cs2.csv', content: `${header}\nplayer-a,Demo,valorant|cs2,,Mouse A,Keyboard A,,`.replace('valorant|cs2', '"valorant, cs2"') },
      { game: 'valorant', filename: 'valorant.csv', content: `${header}\nplayer-a,Demo,valorant,,Mouse B,,,` },
    ];
    const result = normalizeProsettingsSummaries(inputs);
    const rows = parse(result.csv, { columns: true, skip_empty_lines: true }) as Array<{ game: string; data_status: string; source_url: string; checked_at: string }>;
    expect(result.records).toBe(3);
    expect(rows.map(row => row.game)).toEqual(['CS2', 'CS2', 'VALORANT']);
    expect(rows.every(row => row.data_status === 'unverified' && !row.source_url && !row.checked_at)).toBe(true);
    const check = validateCsv('player-gear', result.csv);
    expect(check.issues.filter(issue => issue.level === 'error')).toHaveLength(0);
    expect(check.issues.filter(issue => issue.level === 'warning')).toHaveLength(3);
  });

  it('拒绝重复配置、错误游戏和可能执行的表格公式', () => {
    const line = 'p,Demo,cs2,,Mouse A,,,\n';
    expect(() => normalizeProsettingsSummaries([{ game: 'cs2', filename: 'x', content: `${header}\n${line}${line}` }])).toThrow('重复');
    expect(() => normalizeProsettingsSummaries([{ game: 'valorant', filename: 'x', content: `${header}\n${line}` }])).toThrow('游戏');
    expect(() => normalizeProsettingsSummaries([{ game: 'cs2', filename: 'x', content: `${header}\np,Demo,cs2,,=SUM(1),,,` }])).toThrow('公式');
  });

  it('从明细提取入耳耳机，并将同一设备的规格行去重', () => {
    const detail = 'player,display_name,games,category,item_name,spec_key,spec_value\np,Demo,cs2,Earphones,测试耳机,Color,Black\np,Demo,cs2,Earphones,测试耳机,Type,Wired\np,Demo,cs2,Mouse,测试鼠标,Color,Black\n';
    const result = normalizeProsettingsEarphones([{ game: 'cs2', filename: 'gear.csv', content: detail }]);
    expect(result.records).toBe(1);
    expect(validateCsv('player-gear', result.csv).issues.filter(issue => issue.level === 'error')).toHaveLength(0);
    expect(() => normalizeProsettingsEarphones([{ game: 'cs2', filename: 'gear.csv', content: detail + 'p,Demo,cs2,Earphones,另一耳机,Type,Wired\n' }])).toThrow('冲突');
  });
});
