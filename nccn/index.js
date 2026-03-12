const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const USERNAME = process.env.NCCN_USERNAME;
const PASSWORD = process.env.NCCN_PASSWORD;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

if (!USERNAME || !PASSWORD) {
    console.error('Lütfen NCCN_USERNAME ve NCCN_PASSWORD ortam değişkenlerini sağlayın.');
    process.exit(1);
}

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function run() {
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    context.setDefaultTimeout(300000);

    const page = await context.newPage();

    console.log('NCCN Giriş sayfasına gidiliyor...');
    try {
        await page.goto('https://www.nccn.org/login', { waitUntil: 'networkidle' });

        console.log('Kullanıcı bilgileri dolduruluyor...');

        await page.waitForSelector('input[type="email"], input[name="username"], input[name="email"], #email', { timeout: 30000 });
        const usernameField = await page.$('input[type="email"], input[name="username"], input[name="email"], #email');
        if(usernameField) {
            await usernameField.fill(USERNAME);
        } else {
             console.error("Kullanıcı adı alanı bulunamadı!");
        }

        const passwordField = await page.$('input[type="password"], input[name="password"], #password');
        if(passwordField) {
             await passwordField.fill(PASSWORD);
        } else {
            console.log('Şifre alanı ilk ekranda bulunamadı. "İleri" butonuna tıklanıyor olabilir...');
            const nextBtn = await page.$('button[type="submit"], input[type="submit"]');
            if(nextBtn) {
                 await nextBtn.click();
                 await page.waitForTimeout(3000);
                 const newPasswordField = await page.$('input[type="password"], input[name="password"], #password');
                 if(newPasswordField) {
                     await newPasswordField.fill(PASSWORD);
                 } else {
                     console.error("Şifre alanı hala bulunamadı!");
                 }
            }
        }

        const submitBtn = await page.$('button[type="submit"], input[type="submit"], #btn-login, .login-button');
        if (submitBtn) {
            console.log('Giriş yapılıyor...');
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
                submitBtn.click()
            ]);
        }

        await page.waitForTimeout(5000);
        console.log('Giriş adımı tamamlandı. Yönergeler sayfalarına gidiliyor...');

        const categories = [1, 2, 3, 4];

        for (const category of categories) {
            const url = `https://www.nccn.org/guidelines/category_${category}`;
            console.log(`\nNavigasyon: ${url}`);

            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });

                await page.waitForTimeout(3000);

                // Fetch all links that mention "NCCN Guidelines"
                const links = await page.$$('a:has-text("NCCN Guidelines")');

                console.log(`Kategori ${category}'de ${links.length} "NCCN Guidelines" bağlantısı bulundu.`);

                for (let i = 0; i < links.length; i++) {
                    const link = links[i];

                    try {
                        const href = await link.getAttribute('href');
                        const text = await link.innerText();
                        console.log(`\nBağlantı inceleniyor: ${text.trim()}`);

                        // Try to parse out the file name from href
                        let filenameFallback = "download.pdf";
                        if (href) {
                            const parts = href.split('/');
                            filenameFallback = parts[parts.length - 1];
                            if (!filenameFallback.toLowerCase().endsWith('.pdf')) {
                                filenameFallback = `${filenameFallback}.pdf`;
                            }
                        }

                        // Wait for a download event or navigation/popup
                        const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
                        const popupPromise = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);

                        await link.click({ button: 'middle' }); // click middle to force new tab if not direct download

                        const download = await downloadPromise;
                        const popup = await popupPromise;

                        if (download) {
                            const suggestedFilename = download.suggestedFilename();
                            const finalName = suggestedFilename || filenameFallback;
                            const filePath = path.join(DOWNLOAD_DIR, finalName);

                            if (fs.existsSync(filePath)) {
                                console.log(`Atlanıyor: ${finalName} zaten mevcut.`);
                                await download.cancel().catch(() => {});
                            } else {
                                console.log(`İndiriliyor: ${finalName}...`);
                                await download.saveAs(filePath);
                                console.log(`Başarıyla kaydedildi: ${finalName}`);
                            }
                        } else if (popup) {
                            const popupUrl = popup.url();
                            console.log(`Yeni sekme açıldı: ${popupUrl}`);

                            // If the popup url is a PDF, download it
                            if (popupUrl.toLowerCase().includes('.pdf')) {
                                let filename = popupUrl.split('/').pop();
                                if (filename.includes('?')) filename = filename.split('?')[0];
                                if (!filename.toLowerCase().endsWith('.pdf')) filename = `${filename}.pdf`;

                                const filePath = path.join(DOWNLOAD_DIR, filename);

                                if (fs.existsSync(filePath)) {
                                     console.log(`Atlanıyor: ${filename} zaten mevcut.`);
                                } else {
                                    console.log(`İndiriliyor: ${filename}...`);

                                    // Fetch using node fetch with cookies
                                    const cookies = await context.cookies();
                                    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

                                    try {
                                        const response = await fetch(popupUrl, {
                                            headers: {
                                                'Cookie': cookieString,
                                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                                            }
                                        });

                                        if (response.ok) {
                                            const buffer = await response.arrayBuffer();
                                            fs.writeFileSync(filePath, Buffer.from(buffer));
                                            console.log(`Başarıyla kaydedildi: ${filename}`);
                                        } else {
                                            console.error(`PDF indirilemedi: HTTP ${response.status}`);
                                        }
                                    } catch (fetchErr) {
                                         console.error(`Fetch hatası: ${fetchErr.message}`);
                                    }
                                }
                            } else {
                                console.log('Yeni sekme bir PDF değil, atlanıyor.');
                            }
                            await popup.close().catch(() => {});
                        } else {
                             console.log('Bağlantı tıklandı ancak ne indirme ne de yeni sekme algılandı.');
                        }
                    } catch (err) {
                        console.error(`Bağlantı işlenirken hata oluştu: ${err.message}`);
                    }

                    // Add small delay between downloads
                    await page.waitForTimeout(2000);
                }
            } catch (pageError) {
                 console.error(`Sayfa yükleme hatası (${url}): ${pageError.message}`);
            }
        }

        console.log('\nTüm işlemler tamamlandı.');

    } catch (error) {
        console.error('Genel hata:', error);
    } finally {
        await browser.close();
    }
}

run();
