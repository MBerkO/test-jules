const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const HASH_FILE = path.join(__dirname, 'downloaded_hashes.json');

async function loadHashes() {
    try {
        const data = await fs.readFile(HASH_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

async function saveHashes(hashes) {
    await fs.writeFile(HASH_FILE, JSON.stringify(hashes, null, 2), 'utf8');
}

async function calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function runScraper(username, password, downloadPath, logFn) {
    const hashes = await loadHashes();

    // Ensure download directory exists
    try {
        await fs.mkdir(downloadPath, { recursive: true });
    } catch (err) {
        throw new Error(`Kayıt klasörü oluşturulamadı: ${err.message}`);
    }

    logFn('Tarayıcı başlatılıyor...', 'info');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        acceptDownloads: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    try {
        logFn('NCCN sayfasına gidiliyor...', 'info');
        await page.goto('https://www.nccn.org/login', { waitUntil: 'domcontentloaded' });

        logFn('Giriş yapılıyor...', 'info');

        // Try filling normal login form. NCCN typically has a login form.
        // Checking based on general login fields. We will assume standard input selectors.
        await page.waitForSelector('input[type="email"], input[name="Email"], input[name="email"], input[id*="email" i], input[id*="username" i]', { timeout: 10000 });

        // Find inputs
        const userInputs = await page.$$('input[type="email"], input[name="Email"], input[name="email"], input[id*="email" i], input[id*="username" i]');
        if(userInputs.length > 0) {
            await userInputs[0].fill(username);
        }

        const passInputs = await page.$$('input[type="password"], input[name="Password"], input[name="password"], input[id*="password" i]');
        if(passInputs.length > 0) {
            await passInputs[0].fill(password);
        }

        // Find and click login button
        const loginBtns = await page.$$('button[type="submit"], input[type="submit"], a:has-text("Login"), button:has-text("Login"), a:has-text("Sign In"), button:has-text("Sign In")');
        if(loginBtns.length > 0) {
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
                loginBtns[0].click()
            ]);
        } else {
            // Press enter on password field
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {}),
                page.keyboard.press('Enter')
            ]);
        }

        logFn('Giriş işlemi tamamlandı (bekleniyor). Kategori sayfalarına geçiliyor...', 'info');
        await page.waitForTimeout(3000); // Wait a bit for any post-login redirects

        const categories = [
            'category_1',
            'category_2',
            'category_3',
            'category_4'
        ];

        for (const category of categories) {
            logFn(`Kategori taranıyor: ${category}`, 'info');
            const catUrl = `https://www.nccn.org/guidelines/${category}`;
            await page.goto(catUrl, { waitUntil: 'domcontentloaded' });

            // Wait for links to appear
            await page.waitForTimeout(2000);

            // Find guideline links. Looking at NCCN structure, they look like: /guidelines/guidelines-detail?category=X&id=Y
            const links = await page.$$eval('a[href*="/guidelines/guidelines-detail"]', anchors => anchors.map(a => a.href));
            const uniqueLinks = [...new Set(links)];

            logFn(`Bu kategoride ${uniqueLinks.length} rehber bulundu.`, 'info');

            for (const link of uniqueLinks) {
                logFn(`Rehber sayfasına gidiliyor: ${link}`, 'info');
                await page.goto(link, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(1000);

                // Look for the main NCCN Guidelines PDF link.
                // Usually it points to something like /professionals/physician_gls/pdf/all.pdf
                // We want to avoid evidence blocks ("_blocks.pdf") or patient ones if possible, but the user said "Ana PDF inecek".
                // Based on standard NCCN layout: Text might be "NCCN Guidelines", or href includes "pdf" and not "blocks".

                const pdfHrefs = await page.$$eval('a[href*=".pdf"]', anchors => {
                    return anchors.map(a => ({ href: a.href, text: a.textContent.trim() }));
                });

                // Filter for the main professional guideline.
                // It's often named exactly "NCCN Guidelines" or is the primary pdf in physician_gls.
                let targetPdfUrl = null;
                for (const item of pdfHrefs) {
                    const text = item.text.toLowerCase();
                    const href = item.href.toLowerCase();

                    if (text === 'nccn guidelines') {
                        targetPdfUrl = item.href;
                        break;
                    }
                    if (href.includes('/physician_gls/') && !href.includes('_blocks') && !href.includes('_patient') && !href.includes('_harmonized') && !href.includes('_enhanced') && !href.includes('_core') && !href.includes('_basic')) {
                        // This might be it if text didn't match exactly but path is right
                        targetPdfUrl = item.href;
                        // Don't break immediately, exact text match is preferred
                    }
                }

                if (targetPdfUrl) {
                    logFn(`PDF bulundu, indiriliyor: ${targetPdfUrl}`, 'info');

                    try {
                        // We use the page context to download it to memory/temp file
                        // The easiest way is to use page.evaluate to fetch it as blob, but since it's same domain,
                        // or we can use Playwright's download event.

                        // We will trigger a click and wait for download
                        const [ download ] = await Promise.all([
                            page.waitForEvent('download', { timeout: 30000 }).catch(e => null),
                            page.evaluate((url) => {
                                const a = document.createElement('a');
                                a.href = url;
                                // a.download = ''; // Force download
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }, targetPdfUrl)
                        ]);

                        if (download) {
                            const tempPath = await download.path();
                            const buffer = await fs.readFile(tempPath);
                            const hash = await calculateHash(buffer);

                            if (hashes[hash]) {
                                logFn(`Bu dosya zaten inmiş (Hash eşleşti). Atlanıyor.`, 'info');
                            } else {
                                const originalFilename = download.suggestedFilename();
                                const finalPath = path.join(downloadPath, originalFilename);

                                await fs.copyFile(tempPath, finalPath);
                                hashes[hash] = {
                                    filename: originalFilename,
                                    date: new Date().toISOString()
                                };
                                await saveHashes(hashes);
                                logFn(`Dosya başarıyla kaydedildi: ${originalFilename}`, 'success');
                            }
                            await download.delete(); // cleanup temp file
                        } else {
                             // Fallback: Use fetch via page context to get buffer
                             logFn(`İndirme eventi tetiklenmedi, fetch ile deneniyor...`, 'info');
                             const bufferObj = await page.evaluate(async (url) => {
                                 const res = await fetch(url);
                                 if(!res.ok) throw new Error('Fetch failed: ' + res.status);
                                 const arrayBuffer = await res.arrayBuffer();
                                 return Array.from(new Uint8Array(arrayBuffer));
                             }, targetPdfUrl);

                             const buffer = Buffer.from(bufferObj);
                             const hash = await calculateHash(buffer);

                             if (hashes[hash]) {
                                logFn(`Bu dosya zaten inmiş (Hash eşleşti). Atlanıyor.`, 'info');
                             } else {
                                // Extract filename from URL
                                const urlParts = targetPdfUrl.split('/');
                                const filename = urlParts[urlParts.length - 1].split('?')[0];
                                const finalPath = path.join(downloadPath, filename);

                                await fs.writeFile(finalPath, buffer);
                                hashes[hash] = {
                                    filename: filename,
                                    date: new Date().toISOString()
                                };
                                await saveHashes(hashes);
                                logFn(`Dosya başarıyla kaydedildi: ${filename}`, 'success');
                             }
                        }

                    } catch (e) {
                        logFn(`PDF indirme hatası: ${e.message}`, 'error');
                    }
                } else {
                    logFn(`Bu sayfada ana "NCCN Guidelines" PDF'i bulunamadı.`, 'info');
                }
            }
        }

    } catch (err) {
        throw err;
    } finally {
        await browser.close();
    }
}

module.exports = { runScraper };
