const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

// Theme Logic
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        toggleSwitch.checked = true;
    }
} else {
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

// Fetch Data
async function loadContent() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();

        document.title = data.siteTitle || 'Kişisel Kartvizit';
        document.getElementById('favicon').href = data.favicon || '';
        document.getElementById('profile-img').src = data.profileImage || '';
        document.getElementById('name').textContent = data.name || '';
        document.getElementById('title').textContent = data.title || '';
        document.getElementById('bio').textContent = data.bio || '';

        const socialContainer = document.getElementById('social-links');
        socialContainer.innerHTML = '';

        if (data.socials) {
            data.socials.forEach(social => {
                if (social.enabled) {
                    const a = document.createElement('a');
                    a.href = social.url;
                    a.target = '_blank';
                    a.innerHTML = `<i class="${social.icon}"></i>`;
                    socialContainer.appendChild(a);
                }
            });
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadContent);
