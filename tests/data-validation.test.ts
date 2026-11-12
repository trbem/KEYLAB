import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateCsv } from '../scripts/data-validation.mjs';

const productHeader = readFileSync(new URL('../data-templates/products.csv', import.meta.url), 'utf8').trim();
const playerHeader = readFileSync(new URL('../data-templates/player-gear.csv', import.meta.url), 'utf8').trim();

describe('商品和选手资料本地检查', () => {
  it('支持空模板、UTF-8 BOM、带逗号的引号字段以及缺失价格', () => {
    const csv = `\uFEFF${productHeader}\nexample-1,"示例,键盘",keyboard,演示品牌,,,,,,,demo,,,\n`;
    expect(validateCsv('products', csv)).toEqual({ count: 1, issues: [] });
    expect(validateCsv('player-gear', playerHeader)).toEqual({ count: 0, issues: [] });
  });

  it('发现来源缺失、无效价格和不安全链接，不能把缺价当作零', () => {
    const csv = `${productHeader}\np-1,测试键盘,keyboard,品牌,-1,CNY,javascript:alert(1),,,2026-02-30,verified,unknown,,\n`;
    const result = validateCsv('products', csv);
    const messages = result.issues.map(issue => issue.message).join(' ');
    expect(messages).toContain('price_cents');
    expect(messages).toContain('image_url');
    expect(messages).toContain('checked_at');
    expect(messages).toContain('来源链接');
    expect(messages).toContain('授权');
  });

  it('检查选手资料的重复 ID 和 verified 来源要求', () => {
    const csv = `${playerHeader}\nx,测试游戏,测试选手,,mouse,品牌,型号,,,2026-11-03,verified,\nx,测试游戏,测试选手,,keyboard,,型号,,,,unverified,\n`;
    const result = validateCsv('player-gear', csv);
    expect(result.count).toBe(2);
    expect(result.issues.some(issue => issue.message.includes('id 重复'))).toBe(true);
    expect(result.issues.some(issue => issue.level === 'error' && issue.message.includes('来源链接'))).toBe(true);
    expect(result.issues.some(issue => issue.level === 'warning')).toBe(true);
  });

  it('拒绝格式错误和与模板不一致的表头', () => {
    expect(() => validateCsv('products', 'id,name\n1,测试')).toThrow('表头');
    expect(() => validateCsv('products', `${productHeader}\n"未结束`)).toThrow('CSV 格式错误');
  });
});
