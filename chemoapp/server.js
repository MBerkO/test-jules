const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const { calculateBSA, calculateCrCl, calculateCarboplatinDose, processChemotherapyDoses } = require('./src/calculators');
const { checkCumulativeAnthracycline } = require('./src/safety');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const PROTOCOLS_DIR = path.join(__dirname, 'protocols');
const ORDERS_DIR = path.join(__dirname, 'data', 'orders');
const LOGS_DIR = path.join(__dirname, 'data', 'logs');

// Helper to ensure directories exist
[ORDERS_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// GET /api/protocols - List all protocols
app.get('/api/protocols', (req, res) => {
  try {
    const files = fs.readdirSync(PROTOCOLS_DIR).filter(file => file.endsWith('.json'));
    const protocols = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(PROTOCOLS_DIR, file), 'utf8'));
      return { id: data.id, name: data.name };
    });
    res.json({ success: true, protocols });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load protocols.' });
  }
});

// POST /api/protocols - Create a new protocol
app.post('/api/protocols', (req, res) => {
  const newProtocol = req.body;
  if (!newProtocol || !newProtocol.id || !newProtocol.name || !newProtocol.phases) {
    return res.status(400).json({ success: false, message: 'Invalid protocol structure. Must include id, name, and phases.' });
  }

  try {
    const safeId = path.basename(newProtocol.id); // Prevent path traversal
    const filePath = path.join(PROTOCOLS_DIR, `${safeId}.json`);

    // Check if it already exists to avoid overwriting accidentally, or you can allow it
    if (fs.existsSync(filePath)) {
       return res.status(400).json({ success: false, message: 'Protocol with this ID already exists. Please choose a different ID.' });
    }

    fs.writeFileSync(filePath, JSON.stringify(newProtocol, null, 2));
    res.json({ success: true, message: 'Protocol successfully created.' });
  } catch (err) {
    console.error('Failed to save new protocol:', err);
    res.status(500).json({ success: false, message: 'Failed to save new protocol.' });
  }
});

// GET /api/protocols/:id - Get specific protocol
app.get('/api/protocols/:id', (req, res) => {
  try {
    // Prevent Path Traversal
    const safeId = path.basename(req.params.id);
    const filePath = path.join(PROTOCOLS_DIR, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json({ success: true, protocol: data });
    } else {
      res.status(404).json({ success: false, message: 'Protocol not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load protocol.' });
  }
});

// POST /api/calculate - Calculate doses for a selected protocol
app.post('/api/calculate', (req, res) => {
  const { protocolId, patient } = req.body;

  if (!protocolId || !patient) {
    return res.status(400).json({ success: false, message: 'Missing protocolId or patient data.' });
  }

  // Basic anthropometrics
  const bsaResult = calculateBSA(patient.weight, patient.height);
  const crcl = calculateCrCl(patient.age, patient.weight, patient.creatinine, patient.gender);

  try {
    // Prevent Path Traversal
    const safeId = path.basename(protocolId);
    const filePath = path.join(PROTOCOLS_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Protocol not found.' });
    }

    const protocol = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Process ALL phases to resolve dose_per_bsa
    const phases = ['home_pre_meds', 'pre_meds', 'chemotherapy', 'post_meds', 'home_post_meds'];
    const newPhases = {};

    phases.forEach(phase => {
        newPhases[phase] = processChemotherapyDoses(protocol.phases[phase], bsaResult.average);
    });

    let processedChemotherapy = newPhases.chemotherapy || [];

    // Specific logic: if Carboplatin is present and an AUC was provided in the protocol (or we mock it as a flat_dose for AUC)
    // For simplicity, let's assume if it's named 'Carboplatin', we might override it with Calvert if AUC is requested.
    // E.g., if a drug has 'target_auc'
    processedChemotherapy = processedChemotherapy.map(drug => {
       if (drug.target_auc) {
         const dose = calculateCarboplatinDose(drug.target_auc, crcl);
         return { ...drug, calculated_dose: dose, original_calculated_dose: dose };
       }
       return drug;
    });
    newPhases.chemotherapy = processedChemotherapy;

    // Safety check for Anthracyclines (using a mock patient ID for demo)
    const mockPatientId = patient.id || 'patient-123';
    const safetyCheck = checkCumulativeAnthracycline(mockPatientId, processedChemotherapy, bsaResult.average);

    const calculationResult = {
      bsa: bsaResult,
      crcl,
      protocol: {
        ...protocol,
        phases: newPhases
      },
      safety_warnings: safetyCheck.isExceeded ? [safetyCheck.warningMessage] : []
    };

    res.json({ success: true, calculation: calculationResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to calculate doses.' });
  }
});

// POST /api/order - Save final order and audit log
app.post('/api/order', (req, res) => {
  const { order, justification, physician } = req.body;

  if (!order || !order.patient || !order.protocol) {
    return res.status(400).json({ success: false, message: 'Invalid order structure.' });
  }

  const orderId = `order-${Date.now()}`;
  const orderFilePath = path.join(ORDERS_DIR, `${orderId}.json`);
  const logFilePath = path.join(LOGS_DIR, `audit.log`);

  try {
    // Save the finalized JSON order
    const orderDataToSave = {
      id: orderId,
      version: "1.0",
      timestamp: new Date().toISOString(),
      physician: physician || "Unknown Physician",
      ...order
    };

    fs.writeFileSync(orderFilePath, JSON.stringify(orderDataToSave, null, 2));

    // Append to Audit Log if there is a manual justification
    const logEntry = `[${new Date().toISOString()}] OrderID: ${orderId} | Physician: ${physician || 'N/A'} | Justification: ${justification || 'No manual changes'} | Protocol: ${order.protocol.name}\n`;
    fs.appendFileSync(logFilePath, logEntry);

    res.json({ success: true, orderId, message: 'Order saved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to save order.' });
  }
});

app.listen(PORT, () => {
  console.log(`ChemoApp API Server running on port ${PORT}`);
});
