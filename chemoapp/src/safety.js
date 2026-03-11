const fs = require('fs');
const path = require('path');

const PATIENTS_DIR = path.join(__dirname, '..', 'data', 'patients');

/**
 * Checks the cumulative dose for Anthracyclines.
 * E.g., Doxorubicin max lifetime dose is ~450-500 mg/m2.
 *
 * @param {string} patientId - The ID of the patient.
 * @param {Array} proposedChemotherapy - The chemotherapy array from the current order.
 * @param {number} bsa - Current Body Surface Area.
 * @returns {object} Status object indicating if a warning is needed.
 */
function checkCumulativeAnthracycline(patientId, proposedChemotherapy, bsa) {
  let warningMessage = null;
  let isExceeded = false;
  let proposedAnthracyclineDose = 0;

  // Find if there is an anthracycline in the proposed order
  const anthracyclineDrug = proposedChemotherapy.find(d => d.is_anthracycline);

  if (anthracyclineDrug) {
    proposedAnthracyclineDose = anthracyclineDrug.calculated_dose; // mg

    // Read patient history (mock up logic)
    const patientFile = path.join(PATIENTS_DIR, `${patientId}.json`);
    let previousCumulativeDose = 0;

    if (fs.existsSync(patientFile)) {
      try {
         const patientData = JSON.parse(fs.readFileSync(patientFile, 'utf8'));
         previousCumulativeDose = patientData.cumulative_anthracycline_mg || 0;
      } catch (err) {
         console.error("Error reading patient history:", err);
      }
    }

    const totalProposedLifetimeMg = previousCumulativeDose + proposedAnthracyclineDose;
    const currentLifetimeMgM2 = totalProposedLifetimeMg / bsa; // Approx check against BSA

    // Threshold ~ 450 mg/m2
    if (currentLifetimeMgM2 > 450) {
      isExceeded = true;
      warningMessage = `UYARI (Kümülatif Doz Aşımı): Hastanın planlanan bu tedavi ile yaşam boyu antrasiklin dozu yaklaşık ${currentLifetimeMgM2.toFixed(1)} mg/m² olacaktır (Güvenlik Sınırı: 450 mg/m²). Tedaviyi onaylıyor musunuz? ("Soft Stop")`;
    }
  }

  return {
    isExceeded,
    warningMessage
  };
}

module.exports = {
  checkCumulativeAnthracycline
};
