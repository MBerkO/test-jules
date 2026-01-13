document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('admin-form');
    const socialsContainer = document.getElementById('socials-container');
    const message = document.getElementById('message');

    let currentData = {};

    // Load data
    try {
        const response = await fetch('/api/settings');
        currentData = await response.json();

        document.getElementById('siteTitle').value = currentData.siteTitle || '';
        document.getElementById('favicon').value = currentData.favicon || '';
        document.getElementById('profileImage').value = currentData.profileImage || '';
        document.getElementById('name').value = currentData.name || '';
        document.getElementById('title').value = currentData.title || '';
        document.getElementById('bio').value = currentData.bio || '';

        renderSocials(currentData.socials);
    } catch (error) {
        console.error('Error loading settings:', error);
    }

    function renderSocials(socials) {
        socialsContainer.innerHTML = '';
        socials.forEach((social, index) => {
            const div = document.createElement('div');
            div.className = 'social-item';
            div.innerHTML = `
                <div class="checkbox-group">
                    <input type="checkbox" id="social-${index}" ${social.enabled ? 'checked' : ''}>
                    <label for="social-${index}" style="margin:0">${social.network.toUpperCase()}</label>
                </div>
                <input type="text" id="url-${index}" value="${social.url}" placeholder="${social.network} URL">
                <input type="hidden" id="icon-${index}" value="${social.icon}">
                <input type="hidden" id="network-${index}" value="${social.network}">
            `;
            socialsContainer.appendChild(div);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedData = {
            siteTitle: document.getElementById('siteTitle').value,
            favicon: document.getElementById('favicon').value,
            profileImage: document.getElementById('profileImage').value,
            name: document.getElementById('name').value,
            title: document.getElementById('title').value,
            bio: document.getElementById('bio').value,
            socials: []
        };

        // Gather socials
        const socialItems = socialsContainer.querySelectorAll('.social-item');
        socialItems.forEach((item, index) => {
            updatedData.socials.push({
                network: item.querySelector(`#network-${index}`).value,
                icon: item.querySelector(`#icon-${index}`).value,
                url: item.querySelector(`#url-${index}`).value,
                enabled: item.querySelector(`#social-${index}`).checked
            });
        });

        // Save
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            const result = await res.json();

            message.textContent = 'Ayarlar kaydedildi!';
            message.style.color = 'green';
            setTimeout(() => { message.textContent = ''; }, 3000);
        } catch (error) {
            console.error('Error saving:', error);
            message.textContent = 'Hata oluştu!';
            message.style.color = 'red';
        }
    });
});
