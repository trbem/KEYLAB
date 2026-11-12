import { test, expect } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), true);
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const userId = '11111111-1111-1111-1111-111111111111';
const postId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const commentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const reportId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

test('社区发布、互动、举报和管理通过模拟 API 完成', async ({ page }) => {
  test.skip(!projectUrl, '未配置 Supabase 地址，无法初始化模拟会话。');
  const storageKey = `sb-${new URL(projectUrl!).hostname.split('.')[0]}-auth-token`;
  let post: Record<string, unknown> | null = null;
  let comment: Record<string, unknown> | null = null;
  let report: Record<string, unknown> | null = null;
  let liked = false, favorited = false, uploaded = false;
  await page.addInitScript(({ key, user }) => localStorage.setItem(key, JSON.stringify({ access_token: 'mock-token', refresh_token: 'mock-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user: { id: user, email: 'demo@example.test', aud: 'authenticated' } })), { key: storageKey, user: userId });
  await page.route('**/auth/v1/**', route => route.fulfill({ status: 200, json: { id: userId, email: 'demo@example.test', aud: 'authenticated' } }));
  await page.route('**/storage/v1/**', async route => {
    const url = route.request().url();
    if (url.includes('/object/sign/') && route.request().method() === 'POST') return route.fulfill({ status: 200, json: { signedURL: '/object/sign/community-images/test.png?token=demo' } });
    if (route.request().method() === 'POST') { uploaded = true; return route.fulfill({ status: 200, json: { Key: 'community-images/test.png' } }); }
    return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Yb8AAAAASUVORK5CYII=', 'base64') });
  });
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.split('/').pop();
    const method = request.method();
    const payload = method === 'POST' || method === 'PATCH' ? request.postDataJSON() : {};
    let result: unknown = [];
    if (path === 'community_moderators') result = { user_id: userId };
    else if (path === 'community_posts') {
      if (method === 'POST') post = { ...payload, id: postId, author_id: userId, status: 'published', created_at: '2026-11-04T08:00:00Z' };
      else if (method === 'PATCH' && post) { post.status = payload.status; result = { id: postId }; }
      else if (method === 'GET') result = post && (post.status === 'published' || request.url().includes('id=in.')) ? [post] : [];
    } else if (path === 'community_comments') {
      if (method === 'POST') comment = { ...payload, id: commentId, author_id: userId, status: 'visible', created_at: '2026-11-04T08:01:00Z' };
      else if (method === 'PATCH' && comment) { comment.status = payload.status; result = { id: commentId }; }
      else if (method === 'GET') result = comment ? [comment] : [];
    } else if (path === 'community_likes') { if (method === 'POST') liked = true; else if (method === 'DELETE') liked = false; else result = liked ? [{ post_id: postId }] : []; }
    else if (path === 'community_favorites') { if (method === 'POST') favorited = true; else if (method === 'DELETE') favorited = false; else result = favorited ? [{ post_id: postId }] : []; }
    else if (path === 'community_reports') { if (method === 'POST') report = { ...payload, id: reportId, created_at: '2026-11-04T08:02:00Z' }; else if (method === 'PATCH') { report = null; result = { id: reportId }; } else result = report ? [report] : []; }
    return route.fulfill({ status: method === 'POST' ? 201 : 200, json: result });
  });
  await page.goto('/community');
  await expect(page.getByText('还没有分享，来发布第一篇吧')).toBeVisible();
  await page.getByRole('button', { name: '发布分享 ↗' }).click();
  const composer = page.getByRole('dialog', { name: '发布分享' });
  await composer.getByPlaceholder('给你的搭配起个名字').fill('我的紫色桌面');
  await composer.getByPlaceholder('介绍一下你的桌面、配色或使用心得').fill('这是我的测试分享。');
  await composer.getByPlaceholder('键盘、鼠标、耳机……').fill('键盘：演示键盘');
  await composer.locator('input[type=file]').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/Yb8AAAAASUVORK5CYII=', 'base64') });
  await composer.getByRole('button', { name: '发布分享 →' }).click();
  await expect(page.getByText('我的紫色桌面')).toBeVisible();
  expect(uploaded).toBe(true);
  await page.getByRole('button', { name: '♡ 点赞' }).click();
  await expect(page.getByRole('button', { name: '♥ 已赞' })).toBeVisible();
  await page.getByRole('button', { name: '☆ 收藏' }).click();
  await expect(page.getByRole('button', { name: '★ 已收藏' })).toBeVisible();
  await page.getByRole('button', { name: '我的收藏' }).click();
  await expect(page.getByText('我的紫色桌面')).toBeVisible();
  await page.getByRole('button', { name: '最新分享' }).click();
  await page.getByRole('button', { name: '查看讨论 ↗' }).click();
  const detail = page.getByRole('dialog', { name: '分享详情' });
  await detail.getByPlaceholder('写下你的想法').fill('这套配色很棒');
  await detail.getByRole('button', { name: '发送评论 →' }).click();
  await expect(detail.getByText('这套配色很棒')).toBeVisible();
  page.once('dialog', dialog => dialog.accept('测试举报'));
  await detail.getByRole('button', { name: '举报帖子' }).click();
  await expect(page.getByRole('status')).toContainText('举报已提交');
  await detail.getByRole('button', { name: '关闭' }).click();
  await page.getByRole('button', { name: '举报管理' }).click();
  const admin = page.getByRole('dialog', { name: '举报管理' });
  await expect(admin.getByText('测试举报')).toBeVisible();
  await expect(admin.getByText('我的紫色桌面')).toBeVisible();
  await admin.getByRole('button', { name: '隐藏并处理' }).click();
  await expect(admin.getByText('暂无待处理举报。')).toBeVisible();
  await admin.getByRole('button', { name: '关闭' }).click();
  await expect(page.getByText('我的紫色桌面')).toHaveCount(0);
});

test('游客浏览并使用邮箱登录入口', async ({ page }) => {
  test.skip(!projectUrl, '未配置 Supabase 地址，无法初始化模拟请求。');
  let otpRequested = false;
  await page.route('**/rest/v1/**', route => route.fulfill({ status: 200, json: [] }));
  await page.route('**/auth/v1/**', route => { if (route.request().url().includes('/otp')) otpRequested = true; return route.fulfill({ status: 200, json: {} }); });
  await page.goto('/community');
  await expect(page.getByText('还没有分享，来发布第一篇吧')).toBeVisible();
  await page.getByRole('button', { name: '发布分享 ↗' }).click();
  const dialog = page.getByRole('dialog', { name: '邮箱登录' });
  await dialog.getByPlaceholder('you@example.com').fill('demo@example.test');
  await dialog.getByRole('button', { name: '发送登录链接 →' }).click();
  await expect(page.getByRole('status')).toContainText('登录链接已发送');
  expect(otpRequested).toBe(true);
});
