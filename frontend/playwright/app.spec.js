const { test, expect } = require('@playwright/test');

test('MCP Switchboard App Test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle('MCP Switchboard');
});
