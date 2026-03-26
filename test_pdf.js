const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the local server
  await page.goto('http://localhost:3000');

  // We need a dummy PDF to upload
  fs.writeFileSync('dummy.pdf', Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000222 00000 n \n0000000317 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n405\n%%EOF'));

  // Upload file
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('dummy.pdf');

  // Wait for the pdf to be rendered
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'before_click.png' });

  // Click on the text item
  const textItem = await page.$('.text-item');
  if (textItem) {
      console.log('Text item found!');
      await textItem.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'after_click.png' });

      // Type something
      await page.keyboard.type(' Test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'after_type.png' });
  } else {
      console.log('No text item found');
  }

  // Click on save
  const saveBtn = await page.$('#save-btn');
  if (saveBtn) {
      console.log('Save button found!');

      page.on('dialog', async dialog => {
          console.log('Dialog message:', dialog.message());
          await dialog.dismiss();
      });

      page.on('console', msg => {
          console.log('Console:', msg.text());
      });

      await saveBtn.click();
      await page.waitForTimeout(2000);
  }

  await browser.close();
})();
