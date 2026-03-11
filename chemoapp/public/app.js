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

// Theme Management
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
}

themeBtn.addEventListener('click', toggleTheme);

// Initialize (Load Protocols and check system theme)
window.onload = async () => {
  // Check system preference for dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('data-theme', 'dark');
  }

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
};

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
