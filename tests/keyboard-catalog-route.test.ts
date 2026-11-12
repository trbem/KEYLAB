import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ readFile: mocks.readFile }));
import { GET } from '../src/app/api/keyboard-catalog/route';

describe('本地成品键盘数据接口', () => {
  beforeEach(() => mocks.readFile.mockReset());
  it('正确区分缺失和损坏，并且不暴露文件内容', async () => {
    mocks.readFile.mockRejectedValueOnce(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    expect(await (await GET()).json()).toEqual({ status: 'missing', products: [] });
    mocks.readFile.mockResolvedValueOnce('{bad');
    expect(await (await GET()).json()).toEqual({ status: 'invalid', products: [] });
  });
  it('读取有效目录并禁用缓存', async () => {
    mocks.readFile.mockResolvedValueOnce(JSON.stringify({ version: 1, products: [] }));
    const response = await GET();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ready', products: [] });
  });
});
