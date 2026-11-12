import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ getSupabase: mocks.client }));
import { listPosts, publishPost } from '../src/lib/community';

describe('社区数据操作', () => {
  beforeEach(() => mocks.client.mockReset());
  afterEach(() => vi.useRealTimers());

  it('读取连接卡住时会停止等待并提示', async () => {
    vi.useFakeTimers();
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), abortSignal: vi.fn() };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockReturnValue(query);
    query.abortSignal.mockReturnValue(new Promise(() => {}));
    mocks.client.mockReturnValue({ from: () => query });
    const assertion = expect(listPosts()).rejects.toThrow('社区连接超时');
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
  });

  it('确定拒绝时清理已上传图片，结果不确定时保留图片', async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn();
    mocks.client.mockReturnValue({ storage: { from: () => ({ upload, remove }) }, from: () => ({ insert }) });
    const input = { title: '标题', body: '内容', deviceList: '', image: new File(['img'], 'x.png', { type: 'image/png' }), userId: 'user-id' };
    insert.mockReturnValueOnce({ abortSignal: () => Promise.resolve({ status: 400, error: {} }) });
    await expect(publishPost(input)).rejects.toThrow('发布失败');
    expect(remove).toHaveBeenCalledTimes(1);
    insert.mockReturnValueOnce({ abortSignal: () => Promise.resolve({ status: 503, error: {} }) });
    await expect(publishPost(input)).rejects.toThrow('无法确认');
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
