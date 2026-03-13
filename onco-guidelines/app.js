document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('guidelinesList');
    const searchInput = document.getElementById('searchInput');
    const institutionFilter = document.getElementById('institutionFilter');
    const cancerTypeFilter = document.getElementById('cancerTypeFilter');
    const yearFilter = document.getElementById('yearFilter');
    const resultCount = document.getElementById('resultCount');
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    let allData = [];

    // Tema Yönetimi
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
            document.body.classList.toggle('light-theme', savedTheme === 'light');
            updateThemeIcon(savedTheme === 'dark');
        } else {
            // Sistem temasını kontrol et
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            updateThemeIcon(prefersDark);

            // Sistem teması değiştiğinde dinle
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if(!localStorage.getItem('theme')) {
                    updateThemeIcon(e.matches);
                }
            });
        }
    }

    function updateThemeIcon(isDark) {
        if (isDark) {
            themeToggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        } else {
            themeToggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-theme') ||
            (!document.body.classList.contains('light-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isCurrentlyDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            updateThemeIcon(false);
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            updateThemeIcon(true);
        }
    });

    initTheme();

    // Veri Çekme ve İşleme
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ağ yanıtı uygun değil');
            }
            return response.json();
        })
        .then(data => {
            allData = data;
            populateYearFilter(data);
            renderList(data);
        })
        .catch(error => {
            console.error('Veri yüklenirken hata:', error);
            listContainer.innerHTML = `<div class="error-message">Veriler yüklenemedi. Lütfen 'fetch_data.js' betiğini çalıştırarak 'data.json' dosyasını oluşturduğunuzdan emin olun. <br>Hata detayı: ${error.message}</div>`;
        });

    function populateYearFilter(data) {
        const years = new Set(data.map(item => item.year).filter(y => y));
        const sortedYears = Array.from(years).sort((a, b) => b - a); // Yeni yıldan eskiye

        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }

    function renderList(data) {
        listContainer.innerHTML = '';

        if (data.length === 0) {
            listContainer.innerHTML = '<div class="loading" style="grid-column: 1 / -1;">Sonuç bulunamadı. Lütfen filtreleri değiştirin.</div>';
            resultCount.textContent = '0 rehber bulundu';
            return;
        }

        const fragment = document.createDocumentFragment();

        data.forEach(item => {
            const card = document.createElement('article');
            card.className = 'guideline-card';

            const header = document.createElement('div');
            header.className = 'guideline-header';

            const instBadge = document.createElement('span');
            instBadge.className = 'institution-badge';
            instBadge.textContent = item.institution;

            const typeBadge = document.createElement('span');
            typeBadge.className = 'cancer-badge';
            typeBadge.textContent = item.cancerType;

            header.appendChild(instBadge);
            header.appendChild(typeBadge);

            const title = document.createElement('h2');
            title.className = 'guideline-title';
            title.textContent = item.title;

            const meta = document.createElement('div');
            meta.className = 'guideline-meta';
            meta.innerHTML = `
                <span><strong>Yıl:</strong> ${item.year}</span>
                <span><strong>Dergi:</strong> ${item.journal}</span>
                ${item.authors ? `<span><strong>Yazarlar:</strong> ${item.authors.length > 50 ? item.authors.substring(0, 50) + '...' : item.authors}</span>` : ''}
            `;

            const link = document.createElement('a');
            link.className = 'guideline-link';
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Rehbere Git';

            card.appendChild(header);
            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(link);

            fragment.appendChild(card);
        });

        listContainer.appendChild(fragment);
        resultCount.textContent = `${data.length} rehber bulundu`;
    }

    function filterData() {
        const searchTerm = searchInput.value.toLowerCase();
        const instValue = institutionFilter.value;
        const typeValue = cancerTypeFilter.value;
        const yearValue = yearFilter.value;

        const filtered = allData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm) ||
                                  (item.authors && item.authors.toLowerCase().includes(searchTerm));
            const matchesInst = instValue === 'all' || item.institution === instValue;
            const matchesType = typeValue === 'all' || item.cancerType === typeValue;
            const matchesYear = yearValue === 'all' || item.year === yearValue;

            return matchesSearch && matchesInst && matchesType && matchesYear;
        });

        renderList(filtered);
    }

    searchInput.addEventListener('input', filterData);
    institutionFilter.addEventListener('change', filterData);
    cancerTypeFilter.addEventListener('change', filterData);
    yearFilter.addEventListener('change', filterData);
});
