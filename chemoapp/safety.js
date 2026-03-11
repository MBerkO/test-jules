/**
 * Checks the cumulative dose for Anthracyclines.
 * Reads patient history from localStorage.
 *
 * @param {string} patientName - The name of the patient.
 * @param {Array} proposedChemotherapy - The chemotherapy array from the current order.
 * @param {number} bsa - Current Body Surface Area.
 * @returns {object} Status object indicating if a warning is needed.
 */
function checkCumulativeAnthracycline(patientName, proposedChemotherapy, bsa) {
  let warningMessage = null;
  let isExceeded = false;
  let proposedAnthracyclineDose = 0;

  // Find if there is an anthracycline in the proposed order
  const anthracyclineDrug = proposedChemotherapy.find(d => d.is_anthracycline);

  if (anthracyclineDrug) {
    proposedAnthracyclineDose = anthracyclineDrug.calculated_dose; // mg

    // Read patient history from localStorage
    let previousCumulativeDose = 0;
    try {
        const patientsDataStr = localStorage.getItem('chemoapp_patients');
        if (patientsDataStr) {
            const patientsData = JSON.parse(patientsDataStr);
            const patientId = patientName.toLowerCase().replace(/\s+/g, '-');
            const patientData = patientsData[patientId];
            if (patientData && patientData.cumulative_anthracycline_mg) {
                previousCumulativeDose = patientData.cumulative_anthracycline_mg;
            }
        }
    } catch (e) {
        console.error("Error reading patient history from local storage:", e);
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
