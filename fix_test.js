const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
      console.log('Console:', msg.text());
  });

  await page.goto('http://localhost:3000');

  // Let's modify the app.js in memory to use slice()
  await page.evaluate(() => {
      window.handleFileUpload = function(file) {
          if (file.type !== 'application/pdf') {
              alert('Lütfen geçerli bir PDF dosyası seçin.');
              return;
          }

          const reader = new FileReader();
          reader.onload = async function(e) {
              // Copy the array to prevent it being neutered when transferred to worker
              const typedarray = new Uint8Array(e.target.result);
              currentPdfBytes = typedarray.slice(); // Use slice to clone!

              try {
                  pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
                  document.getElementById('page-count').textContent = pdfDoc.numPages;

                  document.getElementById('upload-container').style.display = 'none';
                  document.getElementById('editor-container').style.display = 'flex';
                  document.getElementById('save-btn').style.display = 'block';

                  renderPage(pageNum);
              } catch (err) {
                  console.error('PDF yükleme hatası:', err);
                  alert('PDF yüklenirken bir hata oluştu.');
              }
          };
          reader.readAsArrayBuffer(file);
      };

      const originalSave = document.getElementById('save-btn').onclick;
      document.getElementById('save-btn').addEventListener('click', () => {
          console.log('save button clicked');
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
