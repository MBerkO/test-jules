/**
 * Calculates Body Surface Area (BSA) using different formulas.
 *
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {object} Object containing Mosteller, DuBois, and Average BSA.
 */
function calculateBSA(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return { mosteller: 0, dubois: 0, average: 0 };
  }

  // Mosteller: sqrt((W * H) / 3600)
  const mosteller = Math.sqrt((weight * height) / 3600);

  // DuBois & DuBois: 0.007184 * W^0.425 * H^0.725
  const dubois = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);

  const average = (mosteller + dubois) / 2;

  return {
    mosteller: Number(mosteller.toFixed(2)),
    dubois: Number(dubois.toFixed(2)),
    average: Number(average.toFixed(2))
  };
}

/**
 * Calculates Creatinine Clearance using the Cockcroft-Gault formula.
 *
 * @param {number} age - Age in years
 * @param {number} weight - Weight in kg
 * @param {number} creatinine - Serum Creatinine in mg/dL
 * @param {string} gender - 'male' or 'female'
 * @returns {number} CrCl in mL/min
 */
function calculateCrCl(age, weight, creatinine, gender) {
  if (!age || !weight || !creatinine || creatinine <= 0) return 0;

  // Optional rule for older adults: If SCr < 1.0, round up to 1.0 (safety feature, but using raw value per typical Calvert unless capped)
  const scr = Math.max(creatinine, 0.8); // Simple lower safety bound

  let crcl = ((140 - age) * weight) / (72 * scr);

  if (gender === 'female') {
    crcl *= 0.85;
  }

  return Number(crcl.toFixed(2));
}

/**
 * Calculates Carboplatin dose using Calvert Formula.
 * Dose (mg) = Target AUC x (GFR + 25)
 * GFR is capped at 125 mL/min.
 *
 * @param {number} auc - Target AUC
 * @param {number} crcl - Creatinine Clearance (used as GFR estimate)
 * @returns {number} Dose in mg
 */
function calculateCarboplatinDose(auc, crcl) {
  if (!auc || !crcl) return 0;

  // Cap GFR at 125 mL/min
  const gfr = Math.min(crcl, 125);

  const dose = auc * (gfr + 25);
  return Number(dose.toFixed(0)); // Typically rounded to nearest whole number
}

/**
 * Processes a protocol's chemotherapy drugs and calculates their doses based on BSA.
 *
 * @param {Array} chemotherapy - Array of chemotherapy drug objects
 * @param {number} bsa - Body Surface Area (typically the average)
 * @returns {Array} Updated array with calculated doses
 */
function processChemotherapyDoses(chemotherapy, bsa) {
  if (!chemotherapy || !Array.isArray(chemotherapy)) return chemotherapy;
  return chemotherapy.map(drug => {
    let calculatedDose = undefined;
    let limitApplied = false;

    if (drug.dose_per_bsa !== undefined) {
      calculatedDose = drug.dose_per_bsa * bsa;
    } else if (drug.flat_dose !== undefined) {
      calculatedDose = drug.flat_dose;
    }

    // Apply Maximum Dose Cap (e.g., Vincristine 2mg)
    if (calculatedDose !== undefined && drug.max_dose && calculatedDose > drug.max_dose) {
      calculatedDose = drug.max_dose;
      limitApplied = true;
    }

    if (calculatedDose !== undefined) {
        return {
          ...drug,
          calculated_dose: Number(calculatedDose.toFixed(2)),
          limit_applied: limitApplied,
          original_calculated_dose: Number(calculatedDose.toFixed(2)) // Keep track in case physician changes it
        };
    }
    return drug;
  });
}

module.exports = {
  calculateBSA,
  calculateCrCl,
  calculateCarboplatinDose,
  processChemotherapyDoses
};
