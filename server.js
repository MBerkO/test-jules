const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Get settings
app.get('/api/settings', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            console.error(parseErr);
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});

// Update settings
app.post('/api/settings', (req, res) => {
    const { name, title, bio, socialLinks, theme } = req.body;

    // Validation
    if (typeof name !== 'string' || typeof title !== 'string' || typeof bio !== 'string') {
        return res.status(400).json({ error: 'Invalid data types for name, title, or bio' });
    }

    // Validate socialLinks
    const allowedSocials = ['github', 'linkedin', 'twitter', 'email'];
    const cleanSocialLinks = {};
    if (socialLinks && typeof socialLinks === 'object') {
        for (const key of allowedSocials) {
            if (socialLinks[key] && typeof socialLinks[key] === 'string') {
                cleanSocialLinks[key] = socialLinks[key];
            }
        }
    }

    const newData = {
        name,
        title,
        bio,
        socialLinks: cleanSocialLinks,
        theme: theme || 'light' // Default to light if missing
    };

    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to save data' });
        }
        res.json({ message: 'Settings saved', data: newData });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
