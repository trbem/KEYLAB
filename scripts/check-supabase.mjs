import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';

// Keep configuration and network errors out of output: they may contain credentials.
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function isPublicKey(value) {
  if (value.startsWith('sb_publishable_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

async function main() {
  if (!url || !key) return fail('配置缺失：请检查 Supabase URL 和 Publishable key。');
  let parsed;
  try { parsed = new URL(url); } catch { return fail('配置错误：Supabase URL 格式无效。'); }
  const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.username || parsed.password || (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:'))) {
    return fail('配置错误：Supabase URL 必须使用 HTTPS（本地开发允许 HTTP）。');
  }
  if (!isPublicKey(key)) return fail('配置错误：请使用 Publishable key 或旧版 anon key，切勿使用密钥。');

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error, status, count } = await supabase.from('products')
      .select('id', { count: 'exact' }).limit(1).abortSignal(AbortSignal.timeout(10000));
    if (!error && Array.isArray(data)) {
      console.log(`连接成功：商品表可读取，当前可见商品数 ${count ?? '未知'}。`);
      return;
    }
    if (!error) return fail('连接失败：商品查询未返回预期的数据格式。');
    if (error.code === 'PGRST205' || error.code === '42P01') return fail('Supabase 已响应，但商品表不存在或未暴露到 Data API。');
    if (status === 401 || status === 403 || error.code === '42501') return fail('Supabase 已响应，但密钥或商品表访问权限未通过。');
    if (status) return fail(`Supabase 商品查询未成功（HTTP ${status}），请检查 Data API 和商品表权限。`);
    return fail('连接失败：请检查网络、项目 URL 和 Supabase 项目状态。');
  } catch {
    return fail('连接失败：请检查网络、项目 URL 和 Supabase 项目状态。');
  }
}

await main();
