const { test, expect } = require('@playwright/test');

test.describe('Daily Todo App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000'); // ローカルサーバーでテストする場合
  });

  test('ページが正しくロードされる', async ({ page }) => {
    await expect(page.locator('#title')).toHaveText('Daily Tasks');
    await expect(page.locator('#date-display')).toBeVisible();
  });

  test('タスクのチェックボックスが機能する', async ({ page }) => {
    const firstTaskCheckbox = page.locator('.switch input').first();
    await expect(firstTaskCheckbox).not.toBeChecked();
    await firstTaskCheckbox.check();
    await expect(firstTaskCheckbox).toBeChecked();
  });

  test('全てのタスクを完了するとお祝いメッセージが表示される', async ({ page }) => {
    const checkboxes = page.locator('.switch input');
    for (let i = 0; i < await checkboxes.count(); i++) {
      await checkboxes.nth(i).check();
    }
    await expect(page.locator('#congrats-msg')).toHaveText('✨ 全て完了！ゆっくり休みましょう ✨');
    await expect(page.locator('body')).toHaveClass(/is-complete/);
  });

  test('メモが保存される', async ({ page }) => {
    const memoTextarea = page.locator('#persistent-memo');
    await memoTextarea.fill('テストメモ');
    await page.reload();
    await expect(memoTextarea).toHaveValue('テストメモ');
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

  test('タスクのチェックをオフに戻す確認ダイアログ', async ({ page }) => {
    const firstTaskCheckbox = page.locator('.switch input').first();
    await firstTaskCheckbox.check();
    await expect(firstTaskCheckbox).toBeChecked();

    // ダイアログを処理
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('オフに戻しますか？');
      await dialog.dismiss(); // キャンセル
    });

    await firstTaskCheckbox.uncheck();
    await expect(firstTaskCheckbox).toBeChecked(); // キャンセルされたのでチェックされたまま
  });
});