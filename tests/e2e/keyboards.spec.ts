import { test, expect } from '@playwright/test';

const products = [
  { id: 'maicong-demo', kind: 'keyboard', name: '迈从示例键盘', brand: 'MCHOSE 迈从', description: '示例', priceCents: 23700, priceSource: '迈从官方商城', priceCapturedAt: '2026-11-12', currency: 'CNY', imageUrl: null, purchaseUrl: 'https://example.test/buy', sourceUrl: 'https://example.test/source', capturedAt: '2026-11-12', specs: [{ label: '配列', value: '75配列' }] },
  { id: 'maicong-no-price', kind: 'keyboard', name: '无报价键盘', brand: 'MCHOSE 迈从', description: '', priceCents: null, currency: 'CNY', imageUrl: null, purchaseUrl: null, sourceUrl: null, capturedAt: '2026-11-12', specs: [] },
  { id: 'wooting-demo', kind: 'keyboard', name: 'Wooting 示例键盘', brand: 'Wooting', description: '示例', priceCents: 144900, currency: 'CNY', imageUrl: 'https://example.test/missing.png', purchaseUrl: null, sourceUrl: 'https://example.test/product', capturedAt: '2026-11-09', specs: [{ label: '轴体', value: '示例轴体' }] },
];

test('成品键盘可筛选和查看资料，图片失败时回退', async ({ page }) => {
  await page.route('**/rest/v1/**', route => route.fulfill({ status: 400, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/keyboard-catalog', route => route.fulfill({ json: { status: 'ready', products } }));
  await page.route('https://example.test/missing.png', route => route.abort());
  await page.goto('/parts');
  await page.getByRole('button', { name: '成品键盘', exact: true }).click();
  const cards = page.locator('.keyboard-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.filter({ hasText: '迈从示例键盘' })).toContainText('参考起价 ¥237.00');
  await expect(cards.filter({ hasText: '迈从示例键盘' })).toContainText('价格来源：迈从官方商城 · 采集于 2026-11-12');
  await expect(cards.filter({ hasText: '迈从示例键盘' })).toContainText('以商家页面为准');
  await expect(cards.filter({ hasText: '无报价键盘' })).toContainText('暂无报价');
  await page.getByLabel('筛选品牌').selectOption('Wooting');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('参考起价 ¥1449.00');
  await expect(cards.first()).toContainText('商品图暂不可用');
  await cards.first().getByText('商品资料与规格').click();
  await expect(cards.first()).toContainText('示例轴体');
  await expect(cards.first().getByRole('link', { name: '查看官网 ↗' })).toHaveAttribute('href', 'https://example.test/product');
  await expect(cards.first().getByRole('link', { name: '加入配置 →' })).toHaveCount(0);
  await page.getByLabel('搜索商品').fill('不存在的型号');
  await expect(page.getByText('没有找到匹配的商品。')).toBeVisible();
});

test('本地目录损坏时仍可浏览配件，窄屏筛选可用', async ({ page }) => {
  await page.route('**/rest/v1/**', route => route.fulfill({ status: 400, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/keyboard-catalog', route => route.fulfill({ json: { status: 'invalid', products: [] } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/parts');
  await expect(page.getByText('本地成品键盘资料暂时不可读取。现有配件仍可浏览。')).toBeVisible();
  await expect(page.locator('.library-card').first()).toBeVisible();
  await expect(page.getByLabel('筛选品牌')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
