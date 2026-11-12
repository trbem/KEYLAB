import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { normalizeProsettingsEarphones } from './prosettings-normalize.mjs';

const [cs2Path, valorantPath] = process.argv.slice(2);
if (!cs2Path || !valorantPath) {
  console.error('用法：node scripts/prepare-prosettings-earphones.mjs <CS2 外设明细 CSV> <VALORANT 外设明细 CSV>');
  process.exitCode = 1;
} else {
  try {
    const inputs = await Promise.all([[cs2Path, 'cs2'], [valorantPath, 'valorant']].map(async ([path, game]) => ({ game, filename: basename(path), content: await readFile(path, 'utf8') })));
    const result = normalizeProsettingsEarphones(inputs);
    const dir = resolve('local-data');
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, 'prosettings-earphones.csv'), result.csv, { encoding: 'utf8', flag: 'wx' });
    for (const [game, stats] of Object.entries(result.summary)) console.log(`${game.toUpperCase()}：${stats.records} 条入耳耳机记录。`);
    console.log(`已保存 ${result.records} 条待核验记录到 local-data/prosettings-earphones.csv；未改动原文件或数据库。`);
  } catch (error) {
    if (error?.code === 'EEXIST') console.error('输出文件已存在；为保护已有工作，请先手动另存或移动它再运行。');
    else if (error instanceof Error && !('code' in error)) console.error(error.message);
    else console.error('文件读取或写入失败，请检查路径与权限。');
    process.exitCode = 1;
  }
}
