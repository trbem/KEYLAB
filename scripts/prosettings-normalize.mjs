import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

const columns = ['id', 'game', 'player', 'team', 'category', 'brand', 'model', 'source_url', 'observed_at', 'checked_at', 'data_status', 'notes'];
const categories = { Monitor: 'monitor', Mouse: 'mouse', Keyboard: 'keyboard', Headset: 'headset', Mousepad: 'mousepad' };

function toCsvCell(value) {
  const text = String(value ?? '');
  // CSV quoting does not prevent spreadsheet applications from evaluating formulas.
  if (/^[\s\uFEFF]*[=+@-]/u.test(text)) throw new Error('发现可能被表格软件当作公式的字段，请人工检查原始数据。');
  return `"${text.replaceAll('"', '""')}"`;
}

function makeRecord(game, player, category, model, filename, displayName) {
  const key = [game, player.toLowerCase(), category].join('\u0000');
  const id = `ps-${createHash('sha256').update(key).digest('hex').slice(0, 20)}`;
  const record = { id, game: game === 'cs2' ? 'CS2' : 'VALORANT', player, team: '', category, brand: '', model, source_url: '', observed_at: '', checked_at: '', data_status: 'unverified', notes: `原始文件：${filename}；原始标题：${displayName}；来源链接与采集日期待补充。` };
  return { key, record };
}

function csvFromRecords(records) {
  return [columns.join(','), ...records.map(row => columns.map(column => toCsvCell(row[column])).join(','))].join('\n') + '\n';
}

export function normalizeProsettingsSummaries(inputs) {
  const result = [];
  const seen = new Set();
  const summary = {};
  for (const input of inputs) {
    if (!['cs2', 'valorant'].includes(input.game)) throw new Error('不支持的游戏类型。');
    let rows;
    try {
      rows = parse(input.content, { bom: true, columns: true, skip_empty_lines: true });
    } catch {
      throw new Error('汇总文件的 CSV 格式不正确。');
    }
    if (!rows.length) throw new Error('汇总文件没有选手数据。');
    const expected = ['player', 'display_name', 'games', ...Object.keys(categories)];
    if (expected.some(key => !(key in rows[0]))) throw new Error('汇总文件缺少必要字段。');
    const stats = summary[input.game] ??= { players: 0, records: 0 };
    for (const row of rows) {
      const player = row.player.trim();
      const games = row.games.split(',').map(value => value.trim().toLowerCase());
      if (!player || !games.includes(input.game)) throw new Error('选手标识或游戏字段不符合汇总文件所属游戏。');
      stats.players++;
      for (const [column, category] of Object.entries(categories)) {
        const model = row[column].trim();
        if (!model) continue;
        const { key, record } = makeRecord(input.game, player, category, model, input.filename, row.display_name.trim());
        if (seen.has(key)) throw new Error('同一游戏的选手外设记录重复，请先人工检查。');
        seen.add(key);
        result.push(record);
        stats.records++;
      }
    }
  }
  return { csv: csvFromRecords(result), summary, records: result.length };
}

/** Earphones appear only in detail exports; collapse repeated spec rows without guessing sources. */
export function normalizeProsettingsEarphones(inputs) {
  const records = new Map();
  const summary = {};
  for (const input of inputs) {
    if (!['cs2', 'valorant'].includes(input.game)) throw new Error('不支持的游戏类型。');
    let rows;
    try { rows = parse(input.content, { bom: true, columns: true, skip_empty_lines: true }); }
    catch { throw new Error('明细文件的 CSV 格式不正确。'); }
    if (!rows.length || ['player', 'display_name', 'games', 'category', 'item_name', 'spec_key', 'spec_value'].some(key => !(key in rows[0]))) throw new Error('明细文件缺少数据或必要字段。');
    summary[input.game] ??= { records: 0 };
    for (const row of rows) {
      if (row.category.trim() !== 'Earphones') continue;
      const player = row.player.trim();
      const model = row.item_name.trim();
      if (!player || !model || !row.games.split(',').map(value => value.trim().toLowerCase()).includes(input.game)) throw new Error('入耳耳机记录缺少选手、型号或所属游戏。');
      const { key, record } = makeRecord(input.game, player, 'earphones', model, input.filename, row.display_name.trim());
      if (records.has(key)) {
        if (records.get(key).model !== model) throw new Error('同一选手的入耳耳机型号存在冲突，请先人工检查。');
        continue;
      }
      records.set(key, record);
      summary[input.game].records++;
    }
  }
  return { csv: csvFromRecords([...records.values()]), summary, records: records.size };
}
