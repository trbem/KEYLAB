import { parse } from 'csv-parse/sync';

function rows(content, required) {
  const records = parse(content, { bom: true, columns: true, skip_empty_lines: true });
  if (!records.length || required.some(column => !(column in records[0]))) throw new Error('源文件缺少数据或必要字段。');
  return records;
}

function https(value) {
  if (!value) return null;
  try { const url = new URL(value.trim()); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}

export function cents(value) {
  if (!value?.trim()) return null;
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error('价格格式无效。');
  const result = Number(BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0')));
  if (!Number.isSafeInteger(result)) throw new Error('价格超出范围。');
  return result;
}

// 价格和商品资料来自同一份合并后的 CSV；不根据型号推断价格。
export function maicongPrices(content, capturedAt) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedAt)) throw new Error('请输入价格采集日期 YYYY-MM-DD。');
  const records = rows(content, ['CMS_code', '产品名称', '有价格', '价格来源', '起售价_售价']);
  const ids = new Set();
  const prices = [];
  const conflicts = [];
  for (const row of records) {
    const id = `maicong-${row.CMS_code.trim()}`;
    if (!row.CMS_code.trim() || ids.has(id)) throw new Error(`迈从商品 ID 缺失或重复：${id}`);
    ids.add(id);
    if (row['有价格'] !== '是') continue;
    if (row['价格来源'].trim() !== '迈从官方商城') {
      conflicts.push(`${id}：价格来源未确认`);
      continue;
    }
    try {
      const priceCents = cents(row['起售价_售价']);
      if (priceCents === null) throw new Error('价格缺失');
      prices.push({ id, priceCents, priceSource: '迈从官方商城', priceCapturedAt: capturedAt });
    } catch {
      conflicts.push(`${id}：价格格式无效或缺失`);
    }
  }
  return { prices, conflicts };
}

export function normalizeKeyboards(maicongCsv, wootingCsv, specsCsv) {
  const maicong = rows(maicongCsv, ['CMS_code', '产品名称', '购买链接', '主图链接', '页面URL']);
  const wooting = rows(wootingCsv, ['handle(URL)', '商品名', '主类别', '中国站价', '币种CN', '页面', '主图']);
  const rawSpecs = rows(specsCsv, ['handle', 'label', 'value']);
  const hasPrices = '有价格' in maicong[0] && '起售价_售价' in maicong[0] && '价格来源' in maicong[0];
  const priceData = hasPrices ? maicongPrices(maicongCsv, '2026-11-12') : { prices: [], conflicts: [] };
  if (priceData.conflicts.length) throw new Error(priceData.conflicts.join('\n'));
  const priceById = new Map(priceData.prices.map(price => [price.id, price]));
  const records = [];
  const ids = new Set();
  const add = item => { if (!item.id || ids.has(item.id)) throw new Error('商品 ID 缺失或重复，请检查源数据。'); ids.add(item.id); records.push(item); };
  for (const row of maicong) {
    if (!row.CMS_code.trim() || !row['产品名称'].trim()) throw new Error('迈从商品标识或名称缺失。');
    const fields = [['键盘类型', row['键盘类型']], ['分类（采集数据）', row['分类']], ['配列（采集数据）', row['配列']], ['产品描述', row['产品描述']]];
    const id = `maicong-${row.CMS_code.trim()}`;
    const price = priceById.get(id);
    add({ id, kind: 'keyboard', name: row['产品名称'].trim(), brand: 'MCHOSE 迈从', description: row['产品描述']?.trim() || '', priceCents: price?.priceCents ?? null, ...(price ? { priceSource: price.priceSource, priceCapturedAt: price.priceCapturedAt } : {}), currency: 'CNY', imageUrl: https(row['主图链接']?.split('|')[0]), purchaseUrl: https(row['购买链接']), sourceUrl: https(row['页面URL']), capturedAt: '2026-11-12', specs: fields.filter(([, value]) => value?.trim()).map(([label, value]) => ({ label, value: value.trim() })) });
  }
  for (const row of wooting) {
    if (row['主类别'].trim() !== '键盘' || row['handle(URL)'].trim() === 'wooting-uwu') continue;
    const handle = row['handle(URL)'].trim();
    if (!handle || !row['商品名'].trim()) throw new Error('Wooting 商品标识或名称缺失。');
    const priceCents = cents(row['中国站价']);
    if (priceCents !== null && row['币种CN'].trim() !== 'CNY') throw new Error('中国站币种不是 CNY。');
    const specs = rawSpecs.filter(spec => spec.handle.trim() === handle && spec.label.trim() && spec.value.trim()).map(spec => ({ label: spec.label.trim(), value: spec.value.trim() }));
    add({ id: `wooting-${handle}`, kind: 'keyboard', name: row['商品名'].trim(), brand: 'Wooting', description: row['简介']?.trim() || row['副标题']?.trim() || '', priceCents, currency: 'CNY', imageUrl: https(row['主图']), purchaseUrl: null, sourceUrl: https(row['页面']), capturedAt: '2026-11-09', specs });
  }
  return { version: 1, products: records };
}
