import { describe, expect, it } from 'vitest';
import { cents, normalizeKeyboards } from '../scripts/normalize-keyboards.mjs';
import { parseKeyboardCatalog } from '../src/lib/keyboard-catalog';

const maicongHeader = 'CMS_code,产品名称,购买链接,主图链接,页面URL,键盘类型,分类,配列,产品描述';
const wootingHeader = 'handle(URL),商品名,主类别,中国站价,币种CN,页面,主图,简介,副标题';
const specHeader = 'handle,label,value';
const maicong = `${maicongHeader}\nabc,示例键盘,https://example.test/buy,,https://example.test/source,机械轴,机械轴键盘,75配列,示例\n`;
const wooting = `${wootingHeader}\nkeyboard-one,示例W,键盘,1449.00,CNY,https://example.test/product,https://example.test/image.webp,示例,\nwooting-uwu,小键盘,键盘,299,CNY,https://example.test/uwu,,,\ncase-one,外壳,键盘外壳,100,CNY,https://example.test/case,,,\n`;
const specs = `${specHeader}\nkeyboard-one,配列,80%\n`;

describe('成品键盘目录', () => {
  it('只导入成品键盘，保留缺价、参考价格和规格', () => {
    const result = normalizeKeyboards(maicong, wooting, specs);
    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toMatchObject({ id: 'maicong-abc', priceCents: null, imageUrl: null, purchaseUrl: 'https://example.test/buy' });
    expect(result.products[1]).toMatchObject({ id: 'wooting-keyboard-one', priceCents: 144900, purchaseUrl: null, specs: [{ label: '配列', value: '80%' }] });
    expect(parseKeyboardCatalog(JSON.stringify(result))).toHaveLength(2);
  });
  it('按十进制转换整数分并拒绝错误币种和重复 ID', () => {
    expect(cents('0.01')).toBe(1);
    expect(cents('')).toBeNull();
    expect(() => cents('1.001')).toThrow();
    expect(() => normalizeKeyboards(maicong, wooting.replace('1449.00,CNY', '1449.00,USD'), specs)).toThrow('币种');
    expect(() => normalizeKeyboards(maicong + 'abc,重复,,,,,,,\n', wooting, specs)).toThrow('重复');
  });
  it('读取迈从官方参考起价及来源，同时兼容旧数据', () => {
    const csv = `${maicongHeader},有价格,价格来源,起售价_售价\nabc,示例键盘,https://example.test/buy,,https://example.test/source,机械轴,机械轴键盘,75配列,示例,是,迈从官方商城,237.00\n`;
    const result = normalizeKeyboards(csv, wooting, specs);
    expect(parseKeyboardCatalog(JSON.stringify(result))[0]).toMatchObject({ priceCents: 23700, priceSource: '迈从官方商城', priceCapturedAt: '2026-11-12' });
    expect(() => normalizeKeyboards(csv.replace('237.00', '237.001'), wooting, specs)).toThrow('价格格式');
  });
  it('拒绝损坏目录、重复商品并过滤不安全链接', () => {
    expect(() => parseKeyboardCatalog('{broken')).toThrow();
    const result = normalizeKeyboards(maicong, wooting, specs);
    result.products[0].imageUrl = 'javascript:alert(1)';
    result.products[0].purchaseUrl = 'http://example.test/item';
    expect(parseKeyboardCatalog(JSON.stringify(result))[0]).toMatchObject({ imageUrl: null, purchaseUrl: null });
    result.products.push(result.products[0]);
    expect(() => parseKeyboardCatalog(JSON.stringify(result))).toThrow();
  });
});
