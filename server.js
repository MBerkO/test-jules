const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data.json');

// Get settings
app.get('/api/settings', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Could not read data file' });
        }
        res.json(JSON.parse(data));
    });
});

// Update settings
app.post('/api/settings', (req, res) => {
    const newData = req.body;
    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 4), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not save data file' });
        }
        res.json({ success: true, message: 'Settings saved' });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
