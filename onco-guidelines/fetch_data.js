const https = require('https');
const fs = require('fs');

const SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const SUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const MAX_RESULTS = 50;

// Sorgu: NCCN, ASCO, ESMO, ASTRO vb. kurumlar ve "guideline" veya "guidelines" geçiyor mu
const QUERY = encodeURIComponent('(ASCO[Title] OR ESMO[Title] OR NCCN[Title] OR ASTRO[Title] OR "clinical practice guideline"[Title] OR "consensus guidelines"[Title]) AND (oncology[Title/Abstract] OR cancer[Title/Abstract] OR tumor[Title/Abstract] OR carcinoma[Title/Abstract]) AND (guideline[Title] OR guidelines[Title])');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function fetchGuidelines() {
    try {
        console.log('PubMed üzerinde rehberler aranıyor...');
        const searchUrl = `${SEARCH_URL}?db=pubmed&term=${QUERY}&retmode=json&retmax=${MAX_RESULTS}&sort=date`;
        const searchData = await fetchJson(searchUrl);

        if (!searchData || !searchData.esearchresult || !searchData.esearchresult.idlist) {
            throw new Error('Arama sonuçları alınamadı.');
        }

        const ids = searchData.esearchresult.idlist;
        console.log(`${ids.length} rehber bulundu. Detaylar çekiliyor...`);

        if (ids.length === 0) {
            console.log('Yeni rehber bulunamadı.');
            return;
        }

        const summaryUrl = `${SUMMARY_URL}?db=pubmed&id=${ids.join(',')}&retmode=json`;
        const summaryData = await fetchJson(summaryUrl);
        const results = summaryData.result;

        const guidelines = [];

        for (const id of ids) {
            const item = results[id];
            if (!item) continue;

            // Kurum Tahmini (Basit bir heuristic)
            let institution = 'Diğer';
            const titleUpper = item.title.toUpperCase();
            if (titleUpper.includes('ASCO')) institution = 'ASCO';
            else if (titleUpper.includes('ESMO')) institution = 'ESMO';
            else if (titleUpper.includes('NCCN')) institution = 'NCCN';
            else if (titleUpper.includes('ASTRO')) institution = 'ASTRO';
            else if (titleUpper.includes('NICE')) institution = 'NICE';

            // Kanser Türü Tahmini
            let cancerType = 'Genel Onkoloji';
            if (titleUpper.includes('BREAST')) cancerType = 'Meme Kanseri';
            else if (titleUpper.includes('LUNG')) cancerType = 'Akciğer Kanseri';
            else if (titleUpper.includes('PROSTATE')) cancerType = 'Prostat Kanseri';
            else if (titleUpper.includes('COLORECTAL') || titleUpper.includes('COLON')) cancerType = 'Kolorektal Kanser';
            else if (titleUpper.includes('MELANOMA')) cancerType = 'Melanom';
            else if (titleUpper.includes('OVARIAN')) cancerType = 'Over Kanseri';
            else if (titleUpper.includes('GASTRIC')) cancerType = 'Mide Kanseri';
            else if (titleUpper.includes('PANCREATIC')) cancerType = 'Pankreas Kanseri';
            else if (titleUpper.includes('RENAL')) cancerType = 'Böbrek Kanseri';

            const pubDate = item.pubdate || '';
            const year = pubDate.split(' ')[0] || new Date().getFullYear().toString();

            guidelines.push({
                id: id,
                title: item.title,
                institution: institution,
                cancerType: cancerType,
                year: year,
                journal: item.source,
                authors: item.authors ? item.authors.map(a => a.name).join(', ') : '',
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
            });
        }

        fs.writeFileSync('onco-guidelines/data.json', JSON.stringify(guidelines, null, 2));
        console.log('Veriler onco-guidelines/data.json dosyasına başarıyla kaydedildi!');

    } catch (error) {
        console.error('Veri çekerken bir hata oluştu:', error);
    }
}

fetchGuidelines();
