const API_BASE = '/api';
let currentCalculation = null;

// DOM Elements
const themeBtn = document.getElementById('themeBtn');
const appContainer = document.getElementById('app');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const protocolSelect = document.getElementById('protocolSelect');
const patientForm = document.getElementById('patientForm');
const backBtn = document.getElementById('backBtn');
const printBtn = document.getElementById('printBtn');
const approveBtn = document.getElementById('approveBtn');
const safetyWarning = document.getElementById('safetyWarning');

// Modal DOM Elements
const openCreateProtocolBtn = document.getElementById('openCreateProtocolBtn');
const createProtocolModal = document.getElementById('createProtocolModal');
const closeBtn = document.querySelector('.close-modal');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const createProtocolForm = document.getElementById('createProtocolForm');
const drugListContainer = document.getElementById('drugListContainer');
const addDrugRowBtn = document.getElementById('addDrugRowBtn');

// Theme Management
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
}

themeBtn.addEventListener('click', toggleTheme);

// Load Protocols
async function loadProtocols() {
  try {
    const res = await fetch(`${API_BASE}/protocols`);
    const data = await res.json();
    if (data.success) {
      protocolSelect.innerHTML = '<option value="">-- Lütfen Seçiniz --</option>';
      data.protocols.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        protocolSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Failed to load protocols', err);
    protocolSelect.innerHTML = '<option value="">Hata: Protokoller yüklenemedi</option>';
  }
}

// Initialize (Load Protocols and check system theme)
window.onload = async () => {
  // Check system preference for dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('data-theme', 'dark');
  }
  await loadProtocols();
};

// --- Modal and Protocol Creation Logic ---
openCreateProtocolBtn.addEventListener('click', () => {
  createProtocolModal.classList.remove('hidden');
});

function closeModal() {
  createProtocolModal.classList.add('hidden');
  createProtocolForm.reset();
  drugListContainer.innerHTML = ''; // Clear rows
}

closeBtn.addEventListener('click', closeModal);
cancelCreateBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
  if (e.target === createProtocolModal) {
    closeModal();
  }
});

addDrugRowBtn.addEventListener('click', () => {
  const row = document.createElement('div');
  row.className = 'builder-row';
  row.innerHTML = `
    <button type="button" class="remove-drug-btn" onclick="this.parentElement.remove()">X</button>
    <select class="drugPhase" required>
      <option value="" disabled selected>Faz Seç</option>
      <option value="home_pre_meds">Ev Pre-Medikasyon</option>
      <option value="pre_meds">Hastane Pre-Medikasyon</option>
      <option value="chemotherapy">Kemoterapi İlacı</option>
      <option value="post_meds">Hastane Post-Medikasyon</option>
      <option value="home_post_meds">Ev Post-Medikasyon</option>
    </select>
    <input type="text" class="drugName" placeholder="İlaç Adı" required>
    <select class="drugCalcType" required onchange="toggleDoseInputs(this)">
      <option value="" disabled selected>Hesap Türü</option>
      <option value="bsa">BSA Göre (mg/m²)</option>
      <option value="flat">Sabit Doz</option>
    </select>
    <input type="number" step="0.01" class="drugDose" placeholder="Doz" required>
    <input type="text" class="drugUnit" placeholder="Birim (örn: mg)" required>
    <input type="text" class="drugRoute" placeholder="Yol (örn: IV)">
    <input type="text" class="drugDuration" placeholder="Süre/Sıklık (örn: 15 min)">
  `;
  drugListContainer.appendChild(row);
});

// Helper for UI to switch between placeholder types
window.toggleDoseInputs = function(selectElem) {
  const row = selectElem.parentElement;
  const doseInput = row.querySelector('.drugDose');
  if (selectElem.value === 'bsa') {
    doseInput.placeholder = 'Doz (mg/m²)';
  } else {
    doseInput.placeholder = 'Sabit Doz';
  }
};

createProtocolForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('newProtocolId').value.trim();
  const name = document.getElementById('newProtocolName').value.trim();

  const phases = {
    home_pre_meds: [],
    pre_meds: [],
    chemotherapy: [],
    post_meds: [],
    home_post_meds: []
  };

  const rows = drugListContainer.querySelectorAll('.builder-row');
  rows.forEach(row => {
    const phase = row.querySelector('.drugPhase').value;
    const calcType = row.querySelector('.drugCalcType').value;
    const drugName = row.querySelector('.drugName').value.trim();
    const doseVal = parseFloat(row.querySelector('.drugDose').value);
    const unit = row.querySelector('.drugUnit').value.trim();
    const route = row.querySelector('.drugRoute').value.trim();
    const duration = row.querySelector('.drugDuration').value.trim();

    const drugObj = { drug: drugName, unit, route, duration };

    if (calcType === 'bsa') {
      drugObj.dose_per_bsa = doseVal;
    } else {
      // Flat dose or standard dose
      if (phase === 'chemotherapy') drugObj.flat_dose = doseVal;
      else drugObj.dose = doseVal;
    }

    phases[phase].push(drugObj);
  });

  const newProtocol = { id, name, phases };

  try {
    const res = await fetch(`${API_BASE}/protocols`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProtocol)
    });
    const data = await res.json();

    if (data.success) {
      alert('Protokol başarıyla eklendi!');
      closeModal();
      await loadProtocols(); // Reload dropdown
      protocolSelect.value = id; // Auto-select new protocol
    } else {
      alert('Hata: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Sunucu hatası. Protokol kaydedilemedi.');
  }
});

// Form Submission -> API Calculation
patientForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const patient = {
    name: document.getElementById('patientName').value,
    age: Number(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    weight: Number(document.getElementById('weight').value),
    height: Number(document.getElementById('height').value),
    creatinine: Number(document.getElementById('creatinine').value)
  };
  const protocolId = protocolSelect.value;

  try {
    const res = await fetch(`${API_BASE}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolId, patient })
    });
    const data = await res.json();

    if (data.success) {
      currentCalculation = { patient, ...data.calculation };
      renderStep2(currentCalculation);
      step1.classList.remove('active');
      step2.classList.add('active');
    } else {
      alert('Hesaplama Hatası: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Sunucuya bağlanılamadı.');
  }
});

backBtn.addEventListener('click', () => {
  step2.classList.remove('active');
  step1.classList.add('active');
});

printBtn.addEventListener('click', () => {
  window.print();
});

// Render the calculated data in Step 2
function renderStep2(data) {
  // Update Patient Info Card
  document.getElementById('resHeight').textContent = data.patient.height;
  document.getElementById('resWeight').textContent = data.patient.weight;
  document.getElementById('resBsa').textContent = data.bsa.average;
  document.getElementById('resCrcl').textContent = data.crcl;

  // Update Print Header
  document.getElementById('printPatientInfo').innerHTML = `
    <strong>Hasta:</strong> ${data.patient.name} | <strong>Yaş/Cinsiyet:</strong> ${data.patient.age} / ${data.patient.gender === 'male' ? 'E' : 'K'} <br>
    <strong>Protokol:</strong> ${data.protocol.name} <br>
    <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
  `;

  // Safety Warnings
  if (data.safety_warnings && data.safety_warnings.length > 0) {
    safetyWarning.textContent = data.safety_warnings.join(' | ');
    safetyWarning.classList.remove('hidden');
  } else {
    safetyWarning.classList.add('hidden');
  }

  // Render Phases
  const container = document.getElementById('protocolPhasesContainer');
  container.innerHTML = ''; // Clear previous

  const phaseNames = {
    'home_pre_meds': 'Evde Başlanacak Pre-medikasyon',
    'pre_meds': 'Hastane Pre-medikasyon ve Hidrasyon',
    'chemotherapy': 'KEMOTERAPİ İLAÇLARI',
    'post_meds': 'Hastane Post-medikasyon',
    'home_post_meds': 'Evde Devam Edilecek Destek / G-CSF'
  };

  const phases = data.protocol.phases;

  for (const [phaseKey, phaseDrugs] of Object.entries(phases)) {
    if (!phaseDrugs || phaseDrugs.length === 0) continue;

    const section = document.createElement('div');
    section.className = 'phase-section';

    const header = document.createElement('div');
    header.className = 'phase-header';
    header.textContent = phaseNames[phaseKey] || phaseKey.toUpperCase();
    section.appendChild(header);

    const content = document.createElement('div');
    content.className = 'phase-content';

    phaseDrugs.forEach((drug, index) => {
      const row = document.createElement('div');
      row.className = 'drug-row';

      const doseVal = drug.calculated_dose !== undefined ? drug.calculated_dose : drug.dose;
      const unitVal = drug.unit || '';

      const limitBadge = drug.limit_applied ? ` <span style="color:red; font-size:12px;">(Max Limit: ${drug.max_dose} mg)</span>` : '';

      // Create interactive inputs for FULL manual editing
      row.innerHTML = `
        <input type="text" class="drug-name" data-phase="${phaseKey}" data-index="${index}" data-field="drug" value="${drug.drug}">
        <input type="text" class="drug-dose" data-phase="${phaseKey}" data-index="${index}" data-field="dose" value="${doseVal}">
        <span class="drug-unit">${unitVal} ${limitBadge}</span>
        <input type="text" class="drug-route" data-phase="${phaseKey}" data-index="${index}" data-field="route" value="${drug.route || ''}">
        <input type="text" class="drug-time" data-phase="${phaseKey}" data-index="${index}" data-field="duration" value="${drug.duration || drug.frequency || ''}">
      `;
      content.appendChild(row);
    });

    section.appendChild(content);
    container.appendChild(section);
  }

  // Clear previous justification
  document.getElementById('justification').value = '';
}

// Approval and Saving
approveBtn.addEventListener('click', async () => {
  // Collect modified data from DOM to see if doses were changed
  let hasManualChanges = false;
  const modifiedProtocol = JSON.parse(JSON.stringify(currentCalculation.protocol));

  const inputs = document.querySelectorAll('.drug-row input');
  inputs.forEach(input => {
    const phase = input.getAttribute('data-phase');
    const index = input.getAttribute('data-index');
    const field = input.getAttribute('data-field');
    const val = input.value;

    const originalObj = modifiedProtocol.phases[phase][index];

    if (field === 'dose') {
      const origDose = originalObj.calculated_dose !== undefined ? originalObj.calculated_dose : originalObj.dose;
      if (String(origDose) !== val) {
         hasManualChanges = true;
      }
      if (originalObj.calculated_dose !== undefined) originalObj.calculated_dose = val;
      else originalObj.dose = val;
    } else if (field === 'drug') {
      originalObj.drug = val;
    } else if (field === 'route') {
      originalObj.route = val;
    } else if (field === 'duration') {
      if (originalObj.duration !== undefined) originalObj.duration = val;
      else if (originalObj.frequency !== undefined) originalObj.frequency = val;
    }
  });

  const justificationText = document.getElementById('justification').value.trim();

  if (hasManualChanges && !justificationText) {
    alert("Dikkat: Hesaplanan dozlarda manuel değişiklik yaptınız. Lütfen tıbbi 'Gerekçe' alanını doldurunuz (Audit Log zorunluluğu).");
    document.getElementById('justification').focus();
    return;
  }

  const finalOrderData = {
    patient: currentCalculation.patient,
    bsa: currentCalculation.bsa,
    crcl: currentCalculation.crcl,
    protocol: modifiedProtocol
  };

  try {
    const res = await fetch(`${API_BASE}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: finalOrderData,
        justification: hasManualChanges ? justificationText : "Manuel değişiklik yok",
        physician: "Demo Hekim (Dr. AI)"
      })
    });
    const data = await res.json();

    if (data.success) {
      alert(`Order başarıyla kaydedildi! (Sistem No: ${data.orderId})`);
      // Optionally reset form
      // location.reload();
    } else {
      alert('Kayıt Hatası: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Sunucuya bağlanılamadı.');
  }
});
