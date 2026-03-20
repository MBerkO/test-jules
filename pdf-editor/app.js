// Kütüphane ayarları
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

// Tema Yönetimi
const themeToggleBtn = document.getElementById('theme-toggle');
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

const currentTheme = localStorage.getItem("theme");
if (currentTheme === "dark") {
    document.body.classList.add("dark-mode");
} else if (currentTheme === "light") {
    document.body.classList.add("light-mode");
}

themeToggleBtn.addEventListener("click", function() {
    let theme;
    if (document.body.classList.contains("dark-mode")) {
        document.body.classList.remove("dark-mode");
        document.body.classList.add("light-mode");
        theme = "light";
    } else if (document.body.classList.contains("light-mode")) {
        document.body.classList.remove("light-mode");
        document.body.classList.add("dark-mode");
        theme = "dark";
    } else {
        if (prefersDarkScheme.matches) {
            document.body.classList.add("light-mode");
            theme = "light";
        } else {
            document.body.classList.add("dark-mode");
            theme = "dark";
        }
    }
    localStorage.setItem("theme", theme);
});

// PDF Durum Yönetimi
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let canvas = document.getElementById('pdf-render');
let ctx = canvas.getContext('2d');
let textLayer = document.getElementById('text-layer');

let currentPdfBytes = null; // Asıl dosya bytes
let textModifications = []; // { pageNum, originalText, newText, transform }

// UI Elementleri
const uploadContainer = document.getElementById('upload-container');
const editorContainer = document.getElementById('editor-container');
const fileInput = document.getElementById('pdf-upload');
const saveBtn = document.getElementById('save-btn');
const uploadBox = document.querySelector('.upload-box');

// Dosya Yükleme Eventleri
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

function handleFileUpload(file) {
    if (file.type !== 'application/pdf') {
        alert('Lütfen geçerli bir PDF dosyası seçin.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const arrayBuffer = e.target.result;
        const typedarray = new Uint8Array(arrayBuffer);
        // pdf-lib ArrayBuffer veya Uint8Array bekler, ancak Uint8Array referansını saklarken sorun olabilir.
        // Güvenli olması için verinin kopyasını saklayalım
        currentPdfBytes = new Uint8Array(arrayBuffer).slice(0);

        try {
            pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
            document.getElementById('page-count').textContent = pdfDoc.numPages;

            // UI Geçişi
            uploadContainer.style.display = 'none';
            editorContainer.style.display = 'flex';
            saveBtn.style.display = 'block';

            renderPage(pageNum);
        } catch (err) {
            console.error('PDF yükleme hatası:', err);
            alert('PDF yüklenirken bir hata oluştu.');
        }
    };
    reader.readAsArrayBuffer(file);
}

// Sayfa Çizimi ve Metin Katmanı
async function renderPage(num) {
    pageRendering = true;
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };

    try {
        await page.render(renderContext).promise;

        // Metin katmanını oluştur
        textLayer.innerHTML = '';
        textLayer.style.width = `${viewport.width}px`;
        textLayer.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();

        textContent.items.forEach((item, index) => {
            if (item.str.trim() === '') return;

            const tx = pdfjsLib.Util.transform(
                viewport.transform,
                item.transform
            );

            const div = document.createElement('div');
            div.className = 'text-item';
            div.textContent = item.str;

            const fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));

            div.style.left = `${tx[4]}px`;
            div.style.top = `${tx[5] - fontSize}px`;
            div.style.fontSize = `${fontSize}px`;
            div.style.fontFamily = item.fontName || 'sans-serif';
            div.style.transform = `scaleX(${tx[0] / fontSize})`;

            // Tıklanabilir metin div'i
            div.dataset.originalText = item.str;
            div.dataset.index = index;

            div.addEventListener('click', (e) => handleTextClick(e, div, item, num));

            textLayer.appendChild(div);
        });

        pageRendering = false;
        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }
    } catch (err) {
        console.error('Sayfa render hatası:', err);
    }

    document.getElementById('page-num').textContent = num;
    document.getElementById('prev-page').disabled = num <= 1;
    document.getElementById('next-page').disabled = num >= pdfDoc.numPages;
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

document.getElementById('prev-page').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
});

document.getElementById('next-page').addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
});

// Metin Düzenleme UI Logic
let activeInput = null;

function handleTextClick(e, div, itemData, pNum) {
    e.stopPropagation();

    if (activeInput) {
        saveActiveInput();
    }

    div.classList.add('editing');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.value = div.dataset.modifiedText || div.textContent;

    // Konumlandırma
    input.style.left = div.style.left;
    input.style.top = div.style.top;
    input.style.fontSize = div.style.fontSize;
    input.style.transform = div.style.transform;
    input.style.width = `${Math.max(100, div.offsetWidth + 20)}px`;
    input.style.height = `${div.offsetHeight}px`;

    textLayer.appendChild(input);
    input.focus();
    input.select();

    activeInput = {
        input,
        div,
        itemData,
        pNum
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveActiveInput();
        if (e.key === 'Escape') cancelActiveInput();
    });
}

function saveActiveInput() {
    if (!activeInput) return;

    const { input, div, itemData, pNum } = activeInput;
    const newText = input.value;
    const oldText = div.dataset.originalText;

    if (newText !== oldText) {
        div.textContent = newText;
        div.dataset.modifiedText = newText;

        // Değişikliği listeye kaydet
        const existingModIndex = textModifications.findIndex(
            m => m.pageNum === pNum && m.originalText === oldText
        );

        if (existingModIndex >= 0) {
            textModifications[existingModIndex].newText = newText;
        } else {
            textModifications.push({
                pageNum: pNum,
                originalText: oldText,
                newText: newText,
                transform: itemData.transform
            });
        }
    }

    div.classList.remove('editing');
    input.remove();
    activeInput = null;
}

function cancelActiveInput() {
    if (!activeInput) return;
    const { input, div } = activeInput;
    div.classList.remove('editing');
    input.remove();
    activeInput = null;
}

document.addEventListener('click', (e) => {
    if (activeInput && e.target !== activeInput.input && !e.target.classList.contains('text-item')) {
        saveActiveInput();
    }
});

// Kaydetme ve Değiştirme Mantığı (Core Logic)
saveBtn.addEventListener('click', async () => {
    if (!currentPdfBytes || textModifications.length === 0) {
        alert("Henüz herhangi bir değişiklik yapmadınız.");
        return;
    }

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = "İşleniyor...";

        // Orijinal PDF'i pdf-lib ile yükle
        const pdfDocToSave = await PDFLib.PDFDocument.load(currentPdfBytes, {
            ignoreEncryption: true
        });

        const pages = pdfDocToSave.getPages();

        // Helvetica, Times Roman vb. standart fontları embed et
        const customFont = await pdfDocToSave.embedFont(PDFLib.StandardFonts.Helvetica);

        for (const mod of textModifications) {
            const { pageNum, originalText, newText, transform } = mod;
            if (originalText === newText) continue;

            const page = pages[pageNum - 1]; // sayfa numaraları 1 tabanlıdır

            // 1. Orijinal metni Content Stream'den silmeye çalış
            // (Bu işlem mükemmel olmasa da basit PDF'lerde çalışır. Karmaşık fontlu PDF'ler için
            // "üstünü örtme" yöntemi kullanılmaz, doğrudan metin yok edilir.)
            const { PDFDict, PDFName, PDFStream, decodePDFRawStream } = PDFLib;
            let contentRefs = page.node.get(PDFName.of('Contents'));

            // Ref resolve
            if (contentRefs instanceof PDFLib.PDFRef) {
                // do nothing, we will use it directly if it's not array
            }

            const contentStreams = [];
            const streamRefs = [];

            if (contentRefs instanceof PDFLib.PDFArray) {
                for (let i = 0; i < contentRefs.size(); i++) {
                    const ref = contentRefs.get(i);
                    streamRefs.push(ref);
                    contentStreams.push(pdfDocToSave.context.lookup(ref));
                }
            } else if (contentRefs instanceof PDFLib.PDFRef) {
                streamRefs.push(contentRefs);
                contentStreams.push(pdfDocToSave.context.lookup(contentRefs));
            }

            for (let i = 0; i < contentStreams.length; i++) {
                const stream = contentStreams[i];
                const ref = streamRefs[i];

                if (!stream || !(stream instanceof PDFStream)) continue;

                // Veriyi dekomprese et
                const decodedBytes = decodePDFRawStream(stream).decode();
                let contentString = Array.from(decodedBytes).map(byte => String.fromCharCode(byte)).join('');

                const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pdfEscapeText = (text) => text.replace(/([()\\])/g, "\\$1");

                const escapedOriginal = escapeRegExp(pdfEscapeText(originalText));

                // Eski metni boş string ile değiştir (sil)
                // (Eski metin operatörleri: Tj, TJ vb.)
                const regexTj = new RegExp(`\\(${escapedOriginal}\\)\\s*Tj`, 'g');

                if (contentString.match(regexTj)) {
                    contentString = contentString.replace(regexTj, `() Tj`);
                } else {
                    contentString = contentString.split(`(${pdfEscapeText(originalText)})`).join(`()`);
                    contentString = contentString.split(`<${toHex(originalText)}>`).join(`<>`);
                }

                const newBytes = new Uint8Array(contentString.length);
                for (let j = 0; j < contentString.length; j++) {
                    newBytes[j] = contentString.charCodeAt(j) & 0xFF;
                }

                const newStream = pdfDocToSave.context.flateStream(newBytes);
                pdfDocToSave.context.assign(ref, newStream);
            }

            // 2. Yeni metni doğru koordinatlara drawText ile çiz
            // transform = [scaleX, skewY, skewX, scaleY, translateX, translateY]
            // pdf.js transform matrisi: tx[4] = X pozisyonu, tx[5] = Y pozisyonu (alttan üste pdf-lib koordinatlarıyla)
            // pdf-lib'de (0,0) sol alt köşedir. pdf.js de viewport transform sonrası (0,0) sol üst yapar.
            // Fakat pdf.js'den gelen origin text item transform'u pdf-lib'in page koordinatlarına daha yakındır.

            const fontSize = Math.sqrt((transform[2] * transform[2]) + (transform[3] * transform[3]));

            page.drawText(newText, {
                x: transform[4],
                y: transform[5],
                size: fontSize,
                font: customFont,
                color: PDFLib.rgb(0, 0, 0)
            });
        }

        // Güncellenmiş dosyayı kaydet
        const modifiedPdfBytes = await pdfDocToSave.save();

        // İndirme işlemini tetikle
        const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "duzenlenmis_belge.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("PDF kaydetme hatası:", error);
        alert("PDF işlenirken bir hata oluştu: " + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "PDF'i Kaydet ve İndir";
    }
});

// Hex Çevirici (Bazı PDF fontları metni hex tutar)
function toHex(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16).padStart(4, '0');
    }
    return result;
}