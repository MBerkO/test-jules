const express = require('express');
const path = require('path');
const { runScraper } = require('./scraper');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

let clients = [];

// SSE endpoint to send logs to the client
app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

function sendLog(message, type = 'info') {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ message, type })}\n\n`);
    });
    console.log(`[${type.toUpperCase()}] ${message}`);
}

app.post('/api/start', async (req, res) => {
    const { username, password, downloadPath } = req.body;

    if (!username || !password || !downloadPath) {
        return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
    }

    // Start background process
    runScraper(username, password, downloadPath, sendLog)
        .then(() => {
            sendLog('İşlem başarıyla tamamlandı.', 'success');
        })
        .catch((error) => {
            sendLog(`Hata oluştu: ${error.message}`, 'error');
        });

    res.json({ message: 'İşlem başlatıldı. Lütfen logları takip edin.' });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
