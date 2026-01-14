const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

// Check local storage or system preference
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'dark') {
        toggleSwitch.checked = true;
    }
} else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleSwitch.checked = true;
    }
}

function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}

toggleSwitch.addEventListener('change', switchTheme);

async function loadProfile() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        document.querySelector('.name').textContent = data.name;
        document.querySelector('.title').textContent = data.title;
        document.querySelector('.bio').textContent = data.bio;

        const socialContainer = document.querySelector('.social-links');
        socialContainer.innerHTML = '';

        const icons = {
            github: 'fab fa-github',
            linkedin: 'fab fa-linkedin',
            twitter: 'fab fa-twitter',
            email: 'fas fa-envelope'
        };

        for (const [key, url] of Object.entries(data.socialLinks)) {
            if (url && icons[key]) {
                const a = document.createElement('a');
                a.href = url;
                a.target = key === 'email' ? '_self' : '_blank';
                a.setAttribute('aria-label', key.charAt(0).toUpperCase() + key.slice(1));

                const i = document.createElement('i');
                i.className = icons[key];

                a.appendChild(i);
                socialContainer.appendChild(a);
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadProfile);
