let currentCalculation = null;
let currentProtocols = [];

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

// Load Protocols (from window.DEFAULT_PROTOCOLS + localStorage)
async function loadProtocols() {
  currentProtocols = [...window.DEFAULT_PROTOCOLS];

  // Also load any custom protocols from localStorage
  const savedCustoms = localStorage.getItem('chemoapp_custom_protocols');
  if (savedCustoms) {
      try {
          const customs = JSON.parse(savedCustoms);
          currentProtocols = currentProtocols.concat(customs);
      } catch(e) { console.error("Could not load custom protocols", e); }
  }

  protocolSelect.innerHTML = '<option value="">-- Lütfen Seçiniz --</option>';
  currentProtocols.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    protocolSelect.appendChild(opt);
  });
}

// Initialize
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

  // Check duplicate
  if (currentProtocols.some(p => p.id === id)) {
      alert("Bu ID ile bir protokol zaten var. Lütfen farklı bir ID seçin.");
      return;
  }

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
    let savedCustoms = [];
    const lsCustoms = localStorage.getItem('chemoapp_custom_protocols');
    if (lsCustoms) savedCustoms = JSON.parse(lsCustoms);
    savedCustoms.push(newProtocol);
    localStorage.setItem('chemoapp_custom_protocols', JSON.stringify(savedCustoms));

    alert('Protokol başarıyla eklendi!');
    closeModal();
    await loadProtocols(); // Reload dropdown
    protocolSelect.value = id; // Auto-select new protocol
  } catch (err) {
    console.error(err);
    alert('Tarayıcı depolama (localStorage) hatası. Protokol kaydedilemedi.');
  }
});

// Form Submission -> Static Calculation
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
  const protocol = currentProtocols.find(p => p.id === protocolId);

  if (!protocol) {
      alert("Protokol bulunamadı.");
      return;
  }

  // Use global calculation functions (from calculators.js)
  const bsaResult = calculateBSA(patient.weight, patient.height);
  const crcl = calculateCrCl(patient.age, patient.weight, patient.creatinine, patient.gender);

  const clonedProtocol = JSON.parse(JSON.stringify(protocol));
  const newPhases = {};
  const phaseKeys = ['home_pre_meds', 'pre_meds', 'chemotherapy', 'post_meds', 'home_post_meds'];

  phaseKeys.forEach(phase => {
      newPhases[phase] = processChemotherapyDoses(clonedProtocol.phases[phase], bsaResult.average);
  });

  let processedChemotherapy = newPhases.chemotherapy || [];

  // Carboplatin Calvert override
  processedChemotherapy = processedChemotherapy.map(drug => {
     if (drug.target_auc) {
       const dose = calculateCarboplatinDose(drug.target_auc, crcl);
       return { ...drug, calculated_dose: dose, original_calculated_dose: dose };
     }
     return drug;
  });
  newPhases.chemotherapy = processedChemotherapy;

  // Use global safety function (from safety.js)
  const safetyCheck = checkCumulativeAnthracycline(patient.name, processedChemotherapy, bsaResult.average);

  const calculationResult = {
    patient,
    bsa: bsaResult,
    crcl,
    protocol: {
      ...clonedProtocol,
      phases: newPhases
    },
    safety_warnings: safetyCheck.isExceeded ? [safetyCheck.warningMessage] : []
  };

  currentCalculation = calculationResult;
  renderStep2(currentCalculation);
  step1.classList.remove('active');
  step2.classList.add('active');
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
  document.getElementById('resHeight').textContent = data.patient.height;
  document.getElementById('resWeight').textContent = data.patient.weight;
  document.getElementById('resBsa').textContent = data.bsa.average;
  document.getElementById('resCrcl').textContent = data.crcl;

  document.getElementById('printPatientInfo').innerHTML = `
    <strong>Hasta:</strong> ${data.patient.name} | <strong>Yaş/Cinsiyet:</strong> ${data.patient.age} / ${data.patient.gender === 'male' ? 'E' : 'K'} <br>
    <strong>Protokol:</strong> ${data.protocol.name} <br>
    <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}
  `;

  if (data.safety_warnings && data.safety_warnings.length > 0) {
    safetyWarning.textContent = data.safety_warnings.join(' | ');
    safetyWarning.classList.remove('hidden');
  } else {
    safetyWarning.classList.add('hidden');
  }

  const container = document.getElementById('protocolPhasesContainer');
  container.innerHTML = '';

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

  document.getElementById('justification').value = '';
}

// Approval and Saving (to LocalStorage instead of Backend API)
approveBtn.addEventListener('click', async () => {
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

  const orderId = `order-${Date.now()}`;
  const finalOrderData = {
    id: orderId,
    timestamp: new Date().toISOString(),
    patient: currentCalculation.patient,
    bsa: currentCalculation.bsa,
    crcl: currentCalculation.crcl,
    protocol: modifiedProtocol,
    justification: hasManualChanges ? justificationText : "Manuel değişiklik yok"
  };

  try {
    // Save Order to LocalStorage
    let orders = [];
    const lsOrders = localStorage.getItem('chemoapp_orders');
    if (lsOrders) orders = JSON.parse(lsOrders);
    orders.push(finalOrderData);
    localStorage.setItem('chemoapp_orders', JSON.stringify(orders));

    // Update Patient Anthracycline history in LocalStorage if applicable
    const anthracyclineDrug = modifiedProtocol.phases.chemotherapy.find(d => d.is_anthracycline);
    if (anthracyclineDrug) {
        let patients = {};
        const lsPatients = localStorage.getItem('chemoapp_patients');
        if (lsPatients) patients = JSON.parse(lsPatients);

        const patientId = currentCalculation.patient.name.toLowerCase().replace(/\s+/g, '-');
        if (!patients[patientId]) {
            patients[patientId] = { cumulative_anthracycline_mg: 0 };
        }
        // Safely parse the applied dose (could have been manually edited to a string or number)
        const doseApplied = parseFloat(anthracyclineDrug.calculated_dose) || 0;
        patients[patientId].cumulative_anthracycline_mg += doseApplied;

        localStorage.setItem('chemoapp_patients', JSON.stringify(patients));
    }

    // Append to simple Audit Log Array in LocalStorage
    let logs = [];
    const lsLogs = localStorage.getItem('chemoapp_audit_logs');
    if (lsLogs) logs = JSON.parse(lsLogs);
    logs.push(`[${new Date().toISOString()}] OrderID: ${orderId} | Physician: Demo Hekim | Justification: ${finalOrderData.justification} | Protocol: ${modifiedProtocol.name}`);
    localStorage.setItem('chemoapp_audit_logs', JSON.stringify(logs));

    alert(`Order başarıyla kaydedildi! (Sistem No: ${orderId})`);

  } catch (err) {
    console.error(err);
    alert('Tarayıcı depolama hatası. Order kaydedilemedi.');
  }
});
