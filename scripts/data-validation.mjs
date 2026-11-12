import { parse } from 'csv-parse/sync';

const schemas = {
  products: {
    headers: 'id,name,category,brand,price_cents,currency,image_url,purchase_url,source_url,checked_at,data_status,image_rights,rights_notes,notes'.split(','),
    required: ['id', 'name', 'category', 'data_status'],
    categories: ['keyboard', 'mouse', 'headset', 'earphones', 'mousepad', 'monitor', 'case', 'keycaps', 'pcb', 'plate', 'switches', 'stabilizers', 'case_foam', 'plate_foam', 'switch_pad'],
  },
  'player-gear': {
    headers: 'id,game,player,team,category,brand,model,source_url,observed_at,checked_at,data_status,notes'.split(','),
    required: ['id', 'game', 'player', 'category', 'model', 'data_status'],
    categories: ['keyboard', 'mouse', 'headset', 'earphones', 'mousepad', 'monitor', 'other'],
  },
};

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Validate a UTF-8 CSV locally; this does not verify the factual or legal status of its content. */
export function validateCsv(kind, text) {
  const schema = schemas[kind];
  if (!schema) throw new Error('未知模板类型。');
  let rows;
  try {
    rows = parse(text, { bom: true, skip_empty_lines: true, relax_column_count: false });
  } catch {
    throw new Error('CSV 格式错误：请检查引号、逗号和每行列数。');
  }
  if (!rows.length) throw new Error('文件为空，请保留模板表头。');
  const headers = rows[0].map(value => value.trim());
  if (new Set(headers).size !== headers.length || headers.length !== schema.headers.length || schema.headers.some(name => !headers.includes(name))) {
    throw new Error('表头与模板不一致：请保留所有列，且不要重复或添加列。');
  }

  const issues = [];
  const seen = new Set();
  const add = (level, record, message) => issues.push({ level, record, message });
  rows.slice(1).forEach((cells, index) => {
    const record = index + 1;
    const row = Object.fromEntries(headers.map((name, i) => [name, cells[i].trim()]));
    if (Object.values(row).every(value => !value)) return;
    for (const name of schema.required) if (!row[name]) add('error', record, `缺少必填字段 ${name}。`);
    if (row.id) {
      if (seen.has(row.id)) add('error', record, 'id 重复。');
      seen.add(row.id);
    }
    if (row.category && !schema.categories.includes(row.category)) add('error', record, 'category 不在允许的分类中。');
    if (row.data_status && !['demo', 'unverified', 'verified'].includes(row.data_status)) add('error', record, 'data_status 必须是 demo、unverified 或 verified。');
    for (const field of ['source_url', 'image_url', 'purchase_url']) {
      if (row[field] && !validUrl(row[field])) add('error', record, `${field} 必须是有效的 HTTPS 链接。`);
    }
    for (const field of ['checked_at', 'observed_at']) {
      if (row[field] && !validDate(row[field])) add('error', record, `${field} 必须是有效日期 YYYY-MM-DD。`);
    }
    if (row.data_status === 'verified' && (!row.source_url || !row.checked_at)) add('error', record, 'verified 记录必须填写来源链接和核验日期。');
    if (row.data_status === 'unverified' && (!row.source_url || !row.checked_at)) add('warning', record, '待核验记录缺少来源或核验日期。');
    if (kind === 'products') {
      if (row.price_cents && (!/^\d+$/.test(row.price_cents) || !Number.isSafeInteger(Number(row.price_cents)))) add('error', record, 'price_cents 必须是非负整数分，缺价留空。');
      if (row.currency && row.currency !== 'CNY') add('error', record, '首版 currency 仅支持 CNY，未知可留空。');
      if (row.price_cents && !row.currency) add('error', record, '填写价格时必须填写 currency。');
      if (row.image_rights && !['unknown', 'authorized', 'restricted'].includes(row.image_rights)) add('error', record, 'image_rights 必须是 unknown、authorized 或 restricted。');
      if (row.image_url && row.image_rights !== 'authorized') add('warning', record, '图片使用授权尚未确认或受限，不能据此认定可使用。');
      if (row.image_url && row.image_rights === 'authorized' && !row.rights_notes) add('warning', record, '请填写图片授权依据及使用范围。');
    }
  });
  return { count: rows.slice(1).filter(row => row.some(value => value.trim())).length, issues };
}
