const { test, expect } = require('@playwright/test');

test.describe('Daily Todo App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // LocalStorageをクリアして初期状態に
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('ページが正しくロードされる', async ({ page }) => {
    await expect(page.locator('#title')).toHaveText('Daily Tasks');
    await expect(page.locator('#date-display')).toBeVisible();
  });

  test('タスク一覧が表示される', async ({ page }) => {
    const taskItems = page.locator('.task-item');
    await expect(taskItems).toHaveCount(5); // TASKS = ["シダキュア", "電気", "エアコン", "社員証/社用携帯", "鍵"]
  });

  test('タスクのチェックボックスが機能する', async ({ page }) => {
    // 最初のスイッチ要素をクリック
    const firstSwitch = page.locator('.switch').first();
    const firstCheckbox = firstSwitch.locator('input');
    
    await expect(firstCheckbox).not.toBeChecked();
    await firstSwitch.click();
    await expect(firstCheckbox).toBeChecked();
  });

  test('複数のタスクをチェックできる', async ({ page }) => {
    const switches = page.locator('.switch');
    const switchCount = await switches.count();
    
    // 最初の3つをチェック
    for (let i = 0; i < 3 && i < switchCount; i++) {
      await switches.nth(i).click();
      await expect(switches.nth(i).locator('input')).toBeChecked();
    }
  });

  test('全てのタスクを完了するとお祝いメッセージが表示される', async ({ page }) => {
    const switches = page.locator('.switch');
    const switchCount = await switches.count();
    
    // 全てのスイッチをクリック
    for (let i = 0; i < switchCount; i++) {
      const checkbox = switches.nth(i).locator('input');
      if (!(await checkbox.isChecked())) {
        await switches.nth(i).click();
      }
    }
    
    await expect(page.locator('#congrats-msg')).toContainText('✨ 全て完了！ゆっくり休みましょう ✨');
    await expect(page.locator('body')).toHaveClass(/is-complete/);
  });

  test('メモが保存される', async ({ page }) => {
    const memoTextarea = page.locator('#persistent-memo');
    await memoTextarea.fill('テストメモ');
    await page.reload();
    await expect(memoTextarea).toHaveValue('テストメモ');
  });

  test('メモは異なるセッションでも保存される', async ({ page }) => {
    const memoTextarea = page.locator('#persistent-memo');
    const testMemo = '新規テストメモ';
    
    await memoTextarea.fill(testMemo);
    // LocalStorageに保存されることを確認
    const savedMemo = await page.evaluate(() => localStorage.getItem('persistent_memo'));
    expect(savedMemo).toBe(testMemo);
  });

  test('履歴パネルが開閉する', async ({ page }) => {
    const historyButton = page.locator('.btn-history');
    const historyPanel = page.locator('#history-panel');

    await expect(historyPanel).not.toHaveClass('open');
    await historyButton.click();
    await expect(historyPanel).toHaveClass('open');

    const closeButton = historyPanel.locator('button');
    await closeButton.click();
    await expect(historyPanel).not.toHaveClass('open');
  });

  test('チェック状態がLocalStorageに保存される', async ({ page }) => {
    const firstSwitch = page.locator('.switch').first();
    await firstSwitch.click();

    // LocalStorageにチェック状態が保存されることを確認
    const checkedTasks = await page.evaluate(() => 
      JSON.parse(localStorage.getItem('checked_tasks') || '{}')
    );
    expect(Object.values(checkedTasks).some(v => v === true)).toBe(true);
  });

  test('ページリロード後もチェック状態が保持される', async ({ page }) => {
    const firstSwitch = page.locator('.switch').first();
    const firstCheckbox = firstSwitch.locator('input');
    
    await firstSwitch.click();
    await expect(firstCheckbox).toBeChecked();
    
    // ページをリロード
    await page.reload();
    
    // チェック状態が保持されていることを確認
    const reloadedCheckbox = page.locator('.switch').first().locator('input');
    await expect(reloadedCheckbox).toBeChecked();
  });

  test('背景色がタスク完了状態で変わる', async ({ page }) => {
    const switches = page.locator('.switch');
    const switchCount = await switches.count();
    
    // 最初は変わっていない
    await expect(page.locator('body')).not.toHaveClass('is-complete');
    
    // 全てをチェック
    for (let i = 0; i < switchCount; i++) {
      const checkbox = switches.nth(i).locator('input');
      if (!(await checkbox.isChecked())) {
        await switches.nth(i).click();
      }
    }
    
    // 背景色が変わっていることを確認
    await expect(page.locator('body')).toHaveClass('is-complete');
  });
});