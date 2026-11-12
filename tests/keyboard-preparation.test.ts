import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('重复整理不会覆盖已人工修改的目录', () => {
  const base = resolve(tmpdir());
  const dir = mkdtempSync(join(base, 'keylab-keyboard-test-'));
  try {
    const source = join(dir, 'source');
    mkdirSync(source);
    const files = [join(source, 'm.csv'), join(source, 'w.csv'), join(source, 's.csv')];
    writeFileSync(files[0], 'CMS_code,产品名称,购买链接,主图链接,页面URL\na,键盘,,,https://example.test\n');
    writeFileSync(files[1], 'handle(URL),商品名,主类别,中国站价,币种CN,页面,主图\nx,键盘,键盘,10,CNY,https://example.test,\n');
    writeFileSync(files[2], 'handle,label,value\nx,配列,60%\n');
    const script = resolve('scripts/prepare-keyboards.mjs');
    const run = () => spawnSync(process.execPath, [script, ...files], { cwd: dir, encoding: 'utf8' });
    expect(run().status).toBe(0);
    const output = join(dir, 'local-data', 'keyboard-products.json');
    const original = readFileSync(output, 'utf8');
    expect(run().status).toBe(0);
    writeFileSync(output, original + ' ');
    expect(run().status).toBe(1);
    expect(readFileSync(output, 'utf8')).toBe(original + ' ');
  } finally {
    if (dirname(resolve(dir)) === base && basename(dir).startsWith('keylab-keyboard-test-')) rmSync(dir, { recursive: true, force: true });
  }
});

it('仅补充空价格、备份原目录并报告冲突，重复运行不覆盖人工修改', () => {
  const base = resolve(tmpdir());
  const dir = mkdtempSync(join(base, 'keylab-keyboard-test-'));
  try {
    const folder = join(dir, 'local-data');
    mkdirSync(folder);
    const path = join(folder, 'keyboard-products.json');
    const original = JSON.stringify({ version: 1, products: [
      { id: 'maicong-a', kind: 'keyboard', brand: 'MCHOSE 迈从', currency: 'CNY', priceCents: null, name: '人工名称' },
      { id: 'maicong-b', kind: 'keyboard', brand: 'MCHOSE 迈从', currency: 'CNY', priceCents: 100, name: '保留价格' },
      { id: 'wooting-x', priceCents: 300 },
    ] });
    writeFileSync(path, original);
    const csv = join(dir, 'prices.csv');
    writeFileSync(csv, 'CMS_code,产品名称,有价格,价格来源,起售价_售价\na,键盘A,是,迈从官方商城,237.00\nb,键盘B,是,迈从官方商城,2.00\nc,键盘C,是,迈从官方商城,坏价格\n');
    const script = resolve('scripts/prepare-keyboards.mjs');
    const run = () => spawnSync(process.execPath, [script, '--update-maicong-prices', csv, '2026-11-12'], { cwd: dir, encoding: 'utf8' });
    const first = run();
    expect(first.status).toBe(1);
    expect(first.stderr).toContain('已有价格不同');
    expect(first.stderr).toContain('价格格式无效');
    const updated = readFileSync(path, 'utf8');
    const products = JSON.parse(updated).products;
    expect(products[0]).toMatchObject({ name: '人工名称', priceCents: 23700, priceSource: '迈从官方商城', priceCapturedAt: '2026-11-12' });
    expect(products[1].priceCents).toBe(100);
    expect(products[2].priceCents).toBe(300);
    expect(first.stdout).toContain('已备份原目录');
    const backupPath = first.stdout.match(/已备份原目录：([^\r\n]+)/)?.[1];
    expect(backupPath && readFileSync(backupPath, 'utf8')).toBe(original);
    run();
    expect(readFileSync(path, 'utf8')).toBe(updated);
    writeFileSync(csv, 'CMS_code,产品名称,有价格,价格来源,起售价_售价\na,键盘A,是,迈从官方商城,1\na,键盘B,是,迈从官方商城,2\n');
    expect(run().status).toBe(1);
    expect(readFileSync(path, 'utf8')).toBe(updated);
  } finally {
    if (dirname(resolve(dir)) === base && basename(dir).startsWith('keylab-keyboard-test-')) rmSync(dir, { recursive: true, force: true });
  }
});
