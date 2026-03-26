const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Create a minimal valid PDF locally for upload testing
  const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000222 00000 n \n0000000317 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n405\n%%EOF\n';
  fs.writeFileSync('dummy.pdf', pdfContent);

  await page.goto('http://localhost:3000');

  // Set file to input
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('dummy.pdf');

  // Wait for rendering
  await page.waitForTimeout(2000);

  // Click on the text item
  const textItem = await page.$('.text-item');
  if (textItem) {
      console.log('Text item found! Text:', await textItem.innerText());
      await textItem.click();
      await page.waitForTimeout(500);

      // Select input and change text
      const input = await page.$('.text-input');
      if (input) {
          console.log('Input found!');
          await input.fill('Changed Text');
          await page.keyboard.press('Enter');
          console.log('Text changed.');
      } else {
          console.log('Input not found!');
      }

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
