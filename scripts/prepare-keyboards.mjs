import { copyFile, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { maicongPrices, normalizeKeyboards } from './normalize-keyboards.mjs';

const [maicongPath, wootingPath, specsPath] = process.argv.slice(2);
if (maicongPath === '--update-maicong-prices') {
  try {
    if (!wootingPath || !specsPath) throw new Error('用法：node scripts/prepare-keyboards.mjs --update-maicong-prices <迈从商品 CSV> <采集日期 YYYY-MM-DD>');
    const data = maicongPrices(await readFile(wootingPath, 'utf8'), specsPath);
    const path = resolve('local-data/keyboard-products.json');
    const original = await readFile(path, 'utf8');
    const catalog = JSON.parse(original);
    if (catalog?.version !== 1 || !Array.isArray(catalog.products)) throw new Error('本地商品目录格式无效。');
    const byId = new Map();
    for (const product of catalog.products) {
      if (!product || typeof product.id !== 'string' || !product.id || byId.has(product.id)) throw new Error('本地商品 ID 缺失或重复，未修改目录。');
      byId.set(product.id, product);
    }
    let updated = 0;
    for (const price of data.prices) {
      const product = byId.get(price.id);
      if (!product) { data.conflicts.push(`${price.id}：本地商品不存在`); continue; }
      if (product.kind !== 'keyboard' || product.brand !== 'MCHOSE 迈从' || product.currency !== 'CNY') { data.conflicts.push(`${price.id}：本地商品类型、品牌或币种不匹配`); continue; }
      if (product.priceCents !== null && product.priceCents !== price.priceCents) { data.conflicts.push(`${price.id}：已有价格不同，保留原值`); continue; }
      if (product.priceCents === null) {
        if ((product.priceSource && product.priceSource !== price.priceSource) || (product.priceCapturedAt && product.priceCapturedAt !== price.priceCapturedAt)) { data.conflicts.push(`${price.id}：已有价格来源信息不同，保留原值`); continue; }
        product.priceCents = price.priceCents;
        product.priceSource = price.priceSource;
        product.priceCapturedAt = price.priceCapturedAt;
        updated++;
      }
    }
    if (updated) {
      const suffix = `${Date.now()}-${process.pid}`;
      const backup = `${path}.backup-${suffix}`;
      const temporary = `${path}.tmp-${suffix}`;
      await copyFile(path, backup, constants.COPYFILE_EXCL);
      try {
        await writeFile(temporary, JSON.stringify(catalog, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
        if (await readFile(path, 'utf8') !== original) throw new Error('目录在更新过程中发生变化，未覆盖。');
        await rename(temporary, path);
      } finally { await unlink(temporary).catch(() => {}); }
      console.log(`已备份原目录：${backup}`);
    }
    console.log(`更新迈从价格 ${updated} 款；冲突 ${data.conflicts.length} 项。`);
    for (const conflict of data.conflicts) console.error(conflict);
    if (data.conflicts.length) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error && !('code' in error) ? error.message : '价格资料读取或本地目录更新失败，请检查路径和权限。');
    process.exitCode = 1;
  }
} else if (!maicongPath || !wootingPath || !specsPath) {
  console.error('用法：node scripts/prepare-keyboards.mjs <迈从商品 CSV> <Wooting 商品 CSV> <Wooting 规格 CSV>');
  process.exitCode = 1;
} else {
  try {
    const input = await Promise.all([maicongPath, wootingPath, specsPath].map(path => readFile(path, 'utf8')));
    const output = normalizeKeyboards(...input);
    const dir = resolve('local-data');
    await mkdir(dir, { recursive: true });
    const path = resolve(dir, 'keyboard-products.json');
    const text = JSON.stringify(output, null, 2) + '\n';
    try { await writeFile(path, text, { encoding: 'utf8', flag: 'wx' }); }
    catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      if (await readFile(path, 'utf8') !== text) throw new Error('已有本地商品目录与新结果不同，未覆盖；请先备份并人工处理冲突。');
      console.log('已有本地商品目录与新结果一致，未覆盖。');
    }
    console.log(`本地成品键盘：${output.products.length} 款，迈从 ${output.products.filter(p => p.brand === 'MCHOSE 迈从').length} 款，Wooting ${output.products.filter(p => p.brand === 'Wooting').length} 款。`);
  } catch (error) {
    console.error(error instanceof Error && !('code' in error) ? error.message : '源文件读取或本地目录写入失败，请检查路径和权限。');
    process.exitCode = 1;
  }
}
