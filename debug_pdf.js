const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set console output
  page.on('console', msg => {
      console.log('Console:', msg.text());
  });

  await page.goto('http://localhost:3000');

  // Let's modify the app.js in memory/on page to print the type of currentPdfBytes
  await page.evaluate(() => {
      const originalLoad = window.handleFileUpload;
      window.handleFileUpload = function(file) {
          console.log('File type:', file.type, 'size:', file.size);
          originalLoad(file);
      };

      const originalSave = document.getElementById('save-btn').onclick;
      document.getElementById('save-btn').addEventListener('click', () => {
          console.log('save button clicked');
          console.log('currentPdfBytes is Uint8Array?', currentPdfBytes instanceof Uint8Array);
          console.log('currentPdfBytes length:', currentPdfBytes ? currentPdfBytes.length : 'null');
      });
  });

  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('dummy.pdf');

  await page.waitForTimeout(2000);

  const textItem = await page.$('.text-item');
  if (textItem) {
      await textItem.click();
      await page.waitForTimeout(500);

      const input = await page.$('.text-input');
      if (input) {
          await input.fill('Changed Text');
          await page.keyboard.press('Enter');
      }
  }

  const saveBtn = await page.$('#save-btn');
  if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
  }

  await browser.close();
})();
