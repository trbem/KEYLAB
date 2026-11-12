import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseKeyboardCatalog, type KeyboardCatalog } from '@/lib/keyboard-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let result: KeyboardCatalog;
  try {
    result = { status: 'ready', products: parseKeyboardCatalog(await readFile(join(process.cwd(), 'local-data', 'keyboard-products.json'), 'utf8')) };
  } catch (error) {
    result = { status: error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT' ? 'missing' : 'invalid', products: [] };
  }
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
