import { test, expect } from '@playwright/test';
test('loads the workbench, plays, pauses and seeks recorded chemistry', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '过氧化氢催化分解.' })).toBeVisible();
  await expect(page.getByTestId('vessel-reactor')).toBeVisible();
  await page.getByRole('button', { name: '开始实验', exact: true }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: '暂停实验', exact: true }).click();
  const time = await page.locator('.bench-status-chip').innerText();
  expect(time).not.toContain('0.0 s');
  await expect(page.locator('.collection-stat strong')).not.toHaveText('0.0 mL');
  const slider = page.getByRole('slider', { name: '反应时间轴' });
  await slider.fill('0');
  await expect(page.locator('.bench-status-chip')).toContainText('0.0 s');
  await expect(page.locator('.collection-stat strong')).toHaveText('0.0 mL');
  await page.getByRole('button', { name: '微观视图' }).click();
  await expect(page.locator('.micro-canvas')).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/chemlab-microscopic.png', fullPage: true });
});
test('adds a measured reagent, rejects overflow, and retains amount on pause', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '自由探索' }).click();
  await page.getByRole('textbox', { name: '搜索物质或仪器' }).fill('CuSO4');
  await page.locator('.reagent-card').click();
  await page.getByRole('spinbutton', { name: '加入量', exact: true }).fill('20');
  await page.getByRole('button', { name: '加入实验容器' }).click();
  await expect(page.locator('.material-list')).toContainText('硫酸铜');
  await page.locator('.reagent-card').click();
  await page.getByRole('spinbutton', { name: '加入量', exact: true }).fill('300');
  await page.getByRole('button', { name: '加入实验容器' }).click();
  await expect(page.getByRole('alert')).toContainText('容量');
  await page.getByRole('textbox', { name: '搜索物质或仪器' }).fill('NaOH');
  await page.locator('.reagent-card').click();
  await page.getByRole('spinbutton', { name: '加入量', exact: true }).fill('20');
  await page.getByRole('button', { name: '加入实验容器' }).click();
  await expect(page.locator('.reaction-detail')).toContainText('氢氧化铜');
  await page.getByRole('button', { name: '4×', exact: true }).click();
  await page.getByRole('button', { name: '开始实验', exact: true }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: '暂停实验', exact: true }).click();
  await expect(page.locator('.material-list')).toContainText('氢氧化铜');
  await page.screenshot({ path: 'test-results/chemlab-precipitation.png', fullPage: true });
});
test('moves instruments, adds equipment, pours and connects', async ({ page }) => {
  await page.goto('/');
  const reactor = page.getByRole('button', { name: '锥形瓶 reactor', exact: true });
  const before = await page.getByTestId('vessel-reactor').getAttribute('style');
  const rect = (await reactor.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 - 60, rect.y + rect.height / 2 + 15, { steps: 10 });
  await page.mouse.up();
  expect(await page.getByTestId('vessel-reactor').getAttribute('style')).not.toBe(before);
  await page.getByRole('button', { name: '实验仪器', exact: true }).click();
  await page.locator('.equipment-card').filter({ hasText: '烧杯' }).click();
  const beaker = page.locator('.instrument-item[data-kind="beaker"]');
  await expect(beaker).toBeVisible();
  await reactor.click();
  await page.getByRole('button', { name: '倒液', exact: true }).click();
  await beaker.locator('.instrument-handle').click();
  await expect(page.getByRole('status')).toContainText('操作完成');
  await reactor.click();
  await page.getByRole('button', { name: '橡胶塞密封', exact: true }).click();
  await page.getByRole('button', { name: '连接', exact: true }).click();
  await page.getByRole('button', { name: '集气瓶 collector', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('操作完成');
});
test('all ten lessons load and reach chemically meaningful states', async ({ page }) => {
  await page.goto('/');
  const lessons = [
    ['peroxide', '过氧化氢催化分解', 'peroxide'],
    ['permanganate', '高锰酸钾加热制氧气', 'permanganate'],
    ['carbonate', '碳酸钙与盐酸制 CO₂', 'carbonate'],
    ['zinc', '锌与稀硫酸制氢气', 'zinc'],
    ['precipitate', '蓝色沉淀的诞生', 'copper-hydroxide'],
    ['displacement', '铁与硫酸铜的置换', 'iron-copper'],
    ['neutralization', '酸碱中和反应', 'neutralization'],
    ['indicator', '酚酞的变色魔法', 'neutralization'],
    ['magnesium', '镁条的明亮燃烧', 'magnesium'],
    ['separation', '过滤、蒸发与结晶', ''],
  ];
  for (const [id, title, rule] of lessons) {
    await page.getByRole('button', { name: '切换实验', exact: true }).click();
    await page
      .locator('.experiment-card')
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
      .click();
    await expect(page.locator('h1')).toContainText(title);
    if (['neutralization', 'indicator'].includes(id))
      await page.locator('.recipe-chips button').filter({ hasText: 'HCl' }).click();
    if (id === 'permanganate')
      await page.getByRole('button', { name: '加热', exact: true }).click();
    if (id === 'magnesium')
      await page.getByRole('button', { name: '点燃 / 熄灭', exact: true }).click();
    // Execute the exact store clock in a batch; engine correctness is independently tested.
    const result = await page.evaluate(async (rule) => {
      const storeUrl = performance
        .getEntriesByType('resource')
        .find((e) => e.name.includes('/src/store/lab.ts'))!.name;
      const { useLab } = await import(storeUrl);
      useLab.getState().setRunning(true);
      for (let i = 0; i < 350; i++) useLab.getState().tick();
      useLab.getState().setRunning(false);
      const v = useLab.getState().lab.vessels.find((v: { uid: string }) => v.uid === 'reactor');
      return rule ? v.records[rule]?.extent : v.dissolution;
    }, rule);
    expect(result, `${id} should react/dissolve`).toBeGreaterThan(0);
  }
});
test('filters dissolved salt and then evaporates to crystals', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '切换实验', exact: true }).click();
  await page.locator('.experiment-card').filter({ hasText: '过滤、蒸发与结晶' }).click();
  await page.getByRole('button', { name: '玻璃棒搅拌' }).click();
  await page.evaluate(async () => {
    const storeUrl = performance
      .getEntriesByType('resource')
      .find((e) => e.name.includes('/src/store/lab.ts'))!.name;
    const { useLab } = await import(storeUrl);
    useLab.getState().setRunning(true);
    for (let i = 0; i < 300; i++) useLab.getState().tick();
    useLab.getState().setRunning(false);
  });
  await page.getByRole('button', { name: '过滤', exact: true }).click();
  await page.getByRole('button', { name: '蒸发皿 receiver', exact: true }).click();
  await page.getByRole('button', { name: '蒸发皿 receiver', exact: true }).click();
  await page.getByRole('slider', { name: '目标温度' }).fill('120');
  await page.getByRole('button', { name: '加热', exact: true }).click();
  const result = await page.evaluate(async () => {
    const storeUrl = performance
      .getEntriesByType('resource')
      .find((e) => e.name.includes('/src/store/lab.ts'))!.name;
    const { useLab } = await import(storeUrl);
    useLab.getState().setRunning(true);
    for (let i = 0; i < 650; i++) useLab.getState().tick();
    useLab.getState().setRunning(false);
    const s = useLab.getState();
    const receiver = s.lab.vessels.find((v: { uid: string }) => v.uid === 'receiver');
    return {
      crystal: receiver.crystallized,
      solids: receiver.contents
        .filter((m: { phase: string }) => m.phase === 's')
        .map((m: { id: string }) => m.id),
    };
  });
  expect(result.crystal).toBeGreaterThan(0);
  expect(result.solids).not.toContain('caco3');
  await page.screenshot({ path: 'test-results/chemlab-crystallization.png', fullPage: true });
});
test('mobile layout remains usable and has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '开始实验', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('textbox', { name: '搜索物质或仪器' }).fill('NaOH');
  await page.locator('.reagent-card').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '关闭试剂详情' }).click();
  await page.screenshot({ path: 'test-results/chemlab-mobile.png', fullPage: true });
});

test('reagent drag-and-drop opens measured addition for the target container', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '自由探索' }).click();
  await page.getByRole('textbox', { name: '搜索物质或仪器' }).fill('H2O2');
  await page
    .locator('.reagent-card')
    .dragTo(page.getByRole('button', { name: '烧杯 reactor', exact: true }));
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: '加入实验容器' }).click();
  await expect(page.locator('.material-list')).toContainText('过氧化氢');
});

test('saves a notebook and exports the real material ledger', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '实验笔记', exact: true }).click();
  await page
    .getByRole('textbox', { name: '实验笔记', exact: true })
    .fill('MnO₂ 加速分解但不被消耗。');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出实验记录' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const parts: Buffer[] = [];
  for await (const part of stream!) parts.push(part);
  const result = JSON.parse(Buffer.concat(parts).toString('utf8'));
  expect(result.notes).toContain('不被消耗');
  expect(result.schemaVersion).toBe(1);
  expect(result.lab.vessels.some((v: { uid: string }) => v.uid === 'reactor')).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: '实验笔记', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '实验笔记', exact: true })).toHaveValue(
    'MnO₂ 加速分解但不被消耗。',
  );
});
