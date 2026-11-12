import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn(() => ({ client: true })) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  mocks.createClient.mockClear();
});

describe('统一 Supabase 客户端', () => {
  it('复用已配置的公开客户端', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    const { getSupabase } = await import('../src/lib/supabase');
    expect(getSupabase()).toBe(getSupabase());
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
  });

  it('拒绝秘密密钥和不安全的远程地址', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_test');
    const { getSupabase } = await import('../src/lib/supabase');
    expect(getSupabase()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    expect(getSupabase()).toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
