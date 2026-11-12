import { readFile } from 'node:fs/promises';
import { validateCsv } from './data-validation.mjs';

const [kind, path, option] = process.argv.slice(2);
if (!['products', 'player-gear'].includes(kind) || !path) {
  console.error('用法：node scripts/validate-data.mjs <products|player-gear> <CSV 文件路径> [--all]');
  process.exitCode = 1;
} else {
  try {
    const result = validateCsv(kind, await readFile(path, 'utf8'));
    const shown = option === '--all' ? result.issues : result.issues.slice(0, 10);
    for (const issue of shown) console.log(`${issue.level === 'error' ? '错误' : '提醒'} · 第 ${issue.record} 条记录：${issue.message}`);
    if (shown.length < result.issues.length) console.log(`其余 ${result.issues.length - shown.length} 条提示已省略；加 --all 可查看全部。`);
    const errors = result.issues.filter(issue => issue.level === 'error').length;
    const warnings = result.issues.length - errors;
    console.log(`检查完成：${result.count} 条记录，${errors} 个错误，${warnings} 个提醒。`);
    console.log('格式检查不会验证资料真实性、图片授权或数据库兼容性。');
    if (errors) process.exitCode = 1;
  } catch (error) {
    const knownError = error instanceof Error && ['CSV', '表头', '文件为空'].some(prefix => error.message.startsWith(prefix));
    const message = knownError ? error.message : '无法读取或检查文件，请确认文件路径及权限。';
    console.error(message);
    process.exitCode = 1;
  }
}
