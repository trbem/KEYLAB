import { expect, test } from '@playwright/test';

test('银羽 68 键预览支持拆解和视角重置', async ({ page }) => {
  await page.goto('/parts/ace68');
  await expect(page.getByRole('heading', { name: 'Ace 68 GT 银羽' })).toBeVisible();
  await expect(page.getByText('非官方模型', { exact: false })).toBeVisible();
  await expect(page.locator('.ace-stage canvas')).toBeVisible();
  const bounds = await page.locator('.ace-stage canvas').boundingBox();
  if (!bounds) throw new Error('3D 画布没有可点击区域');
  await page.locator('.ace-stage canvas').click({ position: { x: bounds.width * .35, y: bounds.height * .35 } });
  await expect(page.getByText('已选择：', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '拆解' }).click();
  await expect(page.getByLabel('爆炸程度')).toHaveValue('1');
  await page.getByRole('button', { name: '合体' }).click();
  await expect(page.getByLabel('爆炸程度')).toHaveValue('0');
  await page.getByRole('button', { name: '重置视角' }).click();
  await expect(page.locator('.ace-stage canvas')).toBeVisible();
});

test('窄屏及 WebGL 不可用时显示说明', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (args[0] === 'webgl' || args[0] === 'webgl2') return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/parts/ace68');
  await expect(page.getByText('此浏览器无法使用 WebGL', { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
