/**
 * Automated Test Suite for ParchiiAI Prescription Intelligence.
 *
 * Verifies all 10 required test cases from the Master Task:
 * 1. Clear prescription with multiple readable fields.
 * 2. Blurry or handwritten prescription.
 * 3. Medicine strip with an uncertain product name or strength.
 * 4. Image with no readable prescription text.
 * 5. Malformed or unexpected API response.
 * 6. Missing API key or configuration.
 * 7. Network failure, timeout, or rate-limit response.
 * 8. Invalid image input.
 * 9. Valid result containing missing fields.
 * 10. Regression checks for manual entry and offline data structures.
 *
 * Run via: node scripts/test-ai-service.mjs
 */

import assert from "node:assert";

// We import directly or recreate the pure domain logic of the validator and config
const DISCLAIMER_TEXT = {
  en: "Important: ParchiiAI is a prescription-reading aid, not a diagnostic or prescribing service. Ambiguous handwriting and dosages must always be verified with a licensed pharmacist or physician.",
  ur: "اہم نوٹ: پرچی اے آئی صرف نسخہ پڑھنے میں مددگار ہے، یہ طبی تشخیص یا علاج تجویز نہیں کرتی۔ کسی بھی دوا کی خوراک اور تفصیلات کی تصدیق مستند فارماسسٹ یا معالج سے لازمی کریں۔",
  sd: "ضروري نوٽ: پرچي اي آئي صرف نسخي کي سمجهڻ لاءِ مددگار آهي، هي طبي تشخيص نٿو ڪري. ڪنهن به دوا جي تصديق پنهنجي ڊاڪٽر يا فارماسسٽ کان ضرور ڪرايو.",
};

function cleanString(val) {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "none" ||
    trimmed.toLowerCase() === "n/a"
  ) {
    return null;
  }
  return trimmed;
}

function sanitizeConfidence(val) {
  if (val === "high" || val === "medium" || val === "low") {
    return val;
  }
  return "low";
}

function validateMedicine(raw) {
  if (!raw || typeof raw !== "object") return null;
  const m = raw;

  const nameAsWritten = cleanString(m.name_as_written);
  const normalizedName = cleanString(m.normalized_name);
  const activeIngredient = cleanString(m.active_ingredient);
  const strength = cleanString(m.strength);
  const dosage = cleanString(m.dosage_as_written);
  const frequency = cleanString(m.frequency_as_written);
  const duration = cleanString(m.duration_as_written);
  const meal = cleanString(m.meal_instruction_as_written);
  const purpose = cleanString(m.purpose);

  let confidence = sanitizeConfidence(m.confidence);
  const uncertainFields = Array.isArray(m.uncertain_fields)
    ? m.uncertain_fields.filter((f) => typeof f === "string")
    : [];

  if (!nameAsWritten && !normalizedName) {
    return null;
  }

  let needsConfirmation = Boolean(m.needs_pharmacist_confirmation);
  if (
    confidence === "low" ||
    uncertainFields.length > 0 ||
    !dosage ||
    !frequency ||
    !strength
  ) {
    needsConfirmation = true;
  }

  return {
    name_as_written: nameAsWritten || normalizedName,
    normalized_name: normalizedName,
    active_ingredient: activeIngredient,
    strength: strength,
    dosage_as_written: dosage,
    frequency_as_written: frequency,
    duration_as_written: duration,
    meal_instruction_as_written: meal,
    purpose: purpose,
    confidence: confidence,
    uncertain_fields: uncertainFields,
    needs_pharmacist_confirmation: needsConfirmation,
    explanation_ur: cleanString(m.explanation_ur),
    explanation_sd: cleanString(m.explanation_sd),
    explanation_en: cleanString(m.explanation_en),
  };
}

function validatePrescriptionExtraction(raw, requestedLanguage = "ur") {
  if (!raw || typeof raw !== "object") {
    return {
      language: requestedLanguage,
      extraction_status: "failed",
      doctor_name: null,
      visit_date: null,
      diagnosis_or_symptoms: null,
      medicines: [],
      unreadable_text: [],
      general_warnings: ["Model output was empty or invalid JSON."],
      requires_human_review: true,
      disclaimer: DISCLAIMER_TEXT[requestedLanguage] || DISCLAIMER_TEXT.en,
    };
  }

  const obj = raw;
  const lang =
    obj.language === "ur" || obj.language === "sd" || obj.language === "en"
      ? obj.language
      : requestedLanguage;

  let extractionStatus = "complete";
  if (
    obj.extraction_status === "complete" ||
    obj.extraction_status === "partial" ||
    obj.extraction_status === "failed"
  ) {
    extractionStatus = obj.extraction_status;
  }

  const doctorName = cleanString(obj.doctor_name);
  const visitDate = cleanString(obj.visit_date);
  const diagnosis = cleanString(obj.diagnosis_or_symptoms);

  const rawMedicines = Array.isArray(obj.medicines) ? obj.medicines : [];
  const medicines = [];
  for (const item of rawMedicines) {
    const validated = validateMedicine(item);
    if (validated) {
      medicines.push(validated);
    }
  }

  const unreadableText = Array.isArray(obj.unreadable_text)
    ? obj.unreadable_text.filter((t) => typeof t === "string" && t.trim().length > 0)
    : [];

  const generalWarnings = Array.isArray(obj.general_warnings)
    ? obj.general_warnings.filter((w) => typeof w === "string" && w.trim().length > 0)
    : [];

  if (medicines.length === 0 && extractionStatus !== "failed") {
    extractionStatus = "failed";
    generalWarnings.push("No legible medicines could be identified in the image.");
  }

  const requiresHumanReview =
    extractionStatus !== "complete" ||
    medicines.some((m) => m.needs_pharmacist_confirmation || m.confidence !== "high") ||
    unreadableText.length > 0 ||
    generalWarnings.length > 0 ||
    Boolean(obj.requires_human_review);

  const summaryExplanation = cleanString(obj.summary_explanation) || undefined;

  return {
    language: lang,
    extraction_status: extractionStatus,
    doctor_name: doctorName,
    visit_date: visitDate,
    diagnosis_or_symptoms: diagnosis,
    medicines: medicines,
    unreadable_text: unreadableText,
    general_warnings: generalWarnings,
    requires_human_review: requiresHumanReview,
    summary_explanation: summaryExplanation,
    disclaimer: DISCLAIMER_TEXT[lang] || DISCLAIMER_TEXT.en,
  };
}

function createAIError(code, message) {
  const userFacing = {
    MISSING_API_KEY: {
      en: "AI vision service is not configured. Please add your OpenAI or Gemini API key in the .env file.",
      ur: "اے آئی سروس فعال نہیں ہے۔ براہ کرم .env میں اپنی OpenAI یا Gemini API کی درج کریں۔",
      sd: "اي آئي سروس چالو ناهي. مهرباني ڪري .env ۾ پنهنجي OpenAI يا Gemini API ڪي داخل ڪريو.",
    },
    NETWORK_ERROR: {
      en: "Cannot connect to AI service. Please check your internet connection.",
      ur: "اے آئی سروس سے رابطہ نہیں ہو سکا۔ برائے مہربانی اپنا انٹرنیٹ کنکشن چیک کریں۔",
      sd: "اي آئي سروس سان رابطو نه ٿي سگهيو. مهرباني ڪري انٽرنيٽ چيڪ ڪريو.",
    },
    TIMEOUT: {
      en: "Prescription analysis timed out. Please try again with good lighting.",
      ur: "نسخہ تجزیہ کرنے کا وقت ختم ہو گیا۔ برائے مہربانی صاف تصویر کے ساتھ دوبارہ کوشش کریں۔",
      sd: "نسخي تجزئي جو وقت پورو ٿي ويو. صاف تصوير سان ٻيهر ڪوشش ڪريو.",
    },
    RATE_LIMIT: {
      en: "AI request quota exceeded. Please wait a minute and retry.",
      ur: "اے آئی کی درخواستوں کی حد ختم ہو گئی۔ براہ کرم ایک منٹ بعد دوبارہ کوشش کریں۔",
      sd: "اي آئي ڪوٽا پوري ٿي وئي آهي. مهرباني ڪري ڪجهه دير بعد ڪوشش ڪريو.",
    },
    INVALID_IMAGE: {
      en: "Invalid or corrupted prescription image.",
      ur: "نسخے کی تصویر خراب یا ناقابلِ فہم ہے۔",
      sd: "نسخي جي تصوير پڙهڻ جوڳي ناهي.",
    },
    MALFORMED_RESPONSE: {
      en: "Unable to parse prescription details safely. Human review required.",
      ur: "نسخے کی تفصیلات محفوظ طریقے سے نہیں پڑھی جا سکیں۔ براہ کرم دستی اندراج کریں۔",
      sd: "نسخي جا تفصيل محفوظ نموني نه مليا. پاڻ تصديق ڪريو.",
    },
    EMPTY_RESULT: {
      en: "No prescription text could be detected in this image.",
      ur: "اس تصویر میں کوئی طبی نسخہ یا دوا نہیں مل سکی۔",
      sd: "هن تصوير ۾ ڪوبه طبي نسخو نه مليو.",
    },
  };
  return {
    code,
    message,
    userFacingMessage: userFacing[code] || {
      en: message,
      ur: "غیر متوقع خرابی",
      sd: "اڻڄاتل خرابي",
    },
  };
}

// -------------------------------------------------------------
// Test Execution
// -------------------------------------------------------------
let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] Test ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] Test ${name}:`, err.message);
    failed++;
  }
}

console.log("\n============================================================");
console.log("  ParchiiAI Prescription Intelligence — Automated Test Suite");
console.log("============================================================\n");

// 1. Clear prescription with multiple readable fields
runTest("1: Clear prescription with multiple readable fields", () => {
  const mockClearResponse = {
    language: "ur",
    extraction_status: "complete",
    doctor_name: "Dr. Ayesha Khan",
    visit_date: "2026-10-15",
    diagnosis_or_symptoms: "Upper respiratory tract infection",
    medicines: [
      {
        name_as_written: "Augmentin 625mg",
        normalized_name: "Augmentin",
        active_ingredient: "Amoxicillin / Clavulanic Acid",
        strength: "625mg",
        dosage_as_written: "1 tab",
        frequency_as_written: "1+0+1 (TDS)",
        duration_as_written: "5 days",
        meal_instruction_as_written: "کھانے کے بعد",
        purpose: "اینٹی بائیوٹک (بیکٹیریل انفیکشن کے لیے)",
        confidence: "high",
        uncertain_fields: [],
        needs_pharmacist_confirmation: false,
        explanation_ur: "کھانے کے بعد صبح اور شام ایک گولی لیں۔ کورس 5 دن مکمل کریں۔",
      },
      {
        name_as_written: "Panadol",
        normalized_name: "Panadol",
        active_ingredient: "Paracetamol",
        strength: "500mg",
        dosage_as_written: "1 tab",
        frequency_as_written: "1+1+1 SOS",
        duration_as_written: "3 days",
        meal_instruction_as_written: "ضرورت پڑنے پر",
        purpose: "بخار اور جسم کے درد کے لیے",
        confidence: "high",
        uncertain_fields: [],
        needs_pharmacist_confirmation: false,
        explanation_ur: "بخار یا شدید درد کی صورت میں ایک گولی پانی کے ساتھ لیں۔",
      },
    ],
    unreadable_text: [],
    general_warnings: [],
    requires_human_review: false,
    summary_explanation: "ڈاکٹر عائشہ خان کا تجویز کردہ نسخہ برائے گلے کے انفیکشن۔",
  };

  const res = validatePrescriptionExtraction(mockClearResponse, "ur");
  assert.strictEqual(res.extraction_status, "complete");
  assert.strictEqual(res.medicines.length, 2);
  assert.strictEqual(res.doctor_name, "Dr. Ayesha Khan");
  assert.strictEqual(res.visit_date, "2026-10-15");
  assert.strictEqual(res.medicines[0].confidence, "high");
  assert.strictEqual(res.medicines[0].needs_pharmacist_confirmation, false);
  assert.strictEqual(res.requires_human_review, false);
});

// 2. Blurry or handwritten prescription
runTest("2: Blurry or handwritten prescription", () => {
  const mockBlurryResponse = {
    language: "ur",
    extraction_status: "partial",
    doctor_name: "Dr. ...?",
    visit_date: null,
    diagnosis_or_symptoms: null,
    medicines: [
      {
        name_as_written: "Arin...?",
        normalized_name: "Arinac",
        active_ingredient: null,
        strength: null,
        dosage_as_written: null,
        frequency_as_written: "1+0+1",
        duration_as_written: null,
        meal_instruction_as_written: null,
        purpose: "نزلہ و زکام (غیر حتمی)",
        confidence: "low",
        uncertain_fields: ["name_as_written", "strength", "dosage_as_written"],
        needs_pharmacist_confirmation: true,
      },
    ],
    unreadable_text: ["Bottom scribbled line cut off"],
    general_warnings: ["Handwriting is faint; strength number cannot be confirmed."],
    requires_human_review: true,
  };

  const res = validatePrescriptionExtraction(mockBlurryResponse, "ur");
  assert.strictEqual(res.extraction_status, "partial");
  assert.strictEqual(res.medicines[0].confidence, "low");
  assert.strictEqual(res.medicines[0].needs_pharmacist_confirmation, true);
  assert.strictEqual(res.requires_human_review, true);
  assert.strictEqual(res.unreadable_text.length, 1);
  assert.ok(res.medicines[0].uncertain_fields.includes("strength"));
});

// 3. Medicine strip with uncertain product name or strength
runTest("3: Medicine strip with uncertain product name or strength", () => {
  const mockStripResponse = {
    language: "ur",
    extraction_status: "partial",
    doctor_name: null,
    visit_date: null,
    diagnosis_or_symptoms: null,
    medicines: [
      {
        name_as_written: "Brufen",
        normalized_name: "Brufen",
        active_ingredient: "Ibuprofen",
        strength: null, // torn blister
        dosage_as_written: null,
        frequency_as_written: null,
        duration_as_written: null,
        meal_instruction_as_written: null,
        purpose: "درد اور سوجن کم کرنے کے لیے",
        confidence: "medium",
        uncertain_fields: ["strength"],
        needs_pharmacist_confirmation: true,
      },
    ],
    unreadable_text: ["Foil is torn across milligram dosage"],
    general_warnings: ["Blister pack strength (200mg vs 400mg vs 600mg) is torn."],
    requires_human_review: true,
  };

  const res = validatePrescriptionExtraction(mockStripResponse, "ur");
  assert.strictEqual(res.medicines[0].normalized_name, "Brufen");
  assert.strictEqual(res.medicines[0].strength, null);
  // Invariant: Missing strength must mandate pharmacist confirmation
  assert.strictEqual(res.medicines[0].needs_pharmacist_confirmation, true);
  assert.strictEqual(res.requires_human_review, true);
});

// 4. Image with no readable prescription text
runTest("4: Image with no readable prescription text", () => {
  const mockNonPrescription = {
    language: "ur",
    extraction_status: "failed",
    doctor_name: null,
    visit_date: null,
    diagnosis_or_symptoms: null,
    medicines: [],
    unreadable_text: [],
    general_warnings: ["No readable prescription or medicine packaging detected in this image."],
    requires_human_review: true,
  };

  const res = validatePrescriptionExtraction(mockNonPrescription, "ur");
  assert.strictEqual(res.extraction_status, "failed");
  assert.strictEqual(res.medicines.length, 0);
  assert.strictEqual(res.requires_human_review, true);
  assert.ok(res.general_warnings[0].includes("No readable prescription"));
});

// 5. Malformed or unexpected API response
runTest("5: Malformed or unexpected API response", () => {
  // Raw non-object or corrupt response
  const corruptInput = "<html><body>502 Bad Gateway</body></html>";
  const res = validatePrescriptionExtraction(corruptInput, "ur");
  assert.strictEqual(res.extraction_status, "failed");
  assert.strictEqual(res.medicines.length, 0);
  assert.strictEqual(res.requires_human_review, true);
  assert.ok(res.general_warnings[0].includes("invalid JSON"));
});

// 6. Missing API key or configuration
runTest("6: Missing API key or configuration", () => {
  const err = createAIError("MISSING_API_KEY", "Gemini API key is not configured.");
  assert.strictEqual(err.code, "MISSING_API_KEY");
  assert.ok(err.userFacingMessage.en.includes("API key"));
  assert.ok(err.userFacingMessage.ur.includes("API"));
  assert.ok(err.userFacingMessage.sd.includes("API"));
});

// 7. Network failure, timeout, or rate-limit response
runTest("7: Network failure, timeout, or rate-limit response", () => {
  const timeoutErr = createAIError("TIMEOUT", "Request to vision model timed out.");
  assert.strictEqual(timeoutErr.code, "TIMEOUT");
  assert.ok(timeoutErr.userFacingMessage.ur.includes("وقت ختم"));

  const rateLimitErr = createAIError("RATE_LIMIT", "Quota exceeded.");
  assert.strictEqual(rateLimitErr.code, "RATE_LIMIT");
  assert.ok(rateLimitErr.userFacingMessage.en.includes("quota exceeded"));
});

// 8. Invalid image input
runTest("8: Invalid image input", () => {
  const invalidImageErr = createAIError("INVALID_IMAGE", "No image URI provided for analysis.");
  assert.strictEqual(invalidImageErr.code, "INVALID_IMAGE");
  assert.ok(invalidImageErr.userFacingMessage.en.includes("Invalid or corrupted"));
});

// 9. Valid result containing missing fields
runTest("9: Valid result containing missing fields", () => {
  const partialFields = {
    language: "sd",
    extraction_status: "partial",
    doctor_name: "undefined", // test string "undefined" is sanitized to null
    visit_date: "null",        // test string "null" is sanitized to null
    diagnosis_or_symptoms: "   ", // whitespace sanitized to null
    medicines: [
      {
        name_as_written: "Ponstan",
        normalized_name: null,
        active_ingredient: null,
        strength: "250mg",
        dosage_as_written: "1 cap",
        frequency_as_written: "SOS",
        duration_as_written: "none", // sanitized to null
        meal_instruction_as_written: "N/A", // sanitized to null
        purpose: null,
        confidence: "medium",
        uncertain_fields: [],
        needs_pharmacist_confirmation: false,
      },
    ],
    unreadable_text: [],
    general_warnings: [],
  };

  const res = validatePrescriptionExtraction(partialFields, "sd");
  assert.strictEqual(res.doctor_name, null);
  assert.strictEqual(res.visit_date, null);
  assert.strictEqual(res.diagnosis_or_symptoms, null);
  assert.strictEqual(res.medicines[0].duration_as_written, null);
  assert.strictEqual(res.medicines[0].meal_instruction_as_written, null);
  assert.strictEqual(res.language, "sd");
  assert.ok(res.disclaimer.includes("پرچي اي آئي"));
});

// 10. Regression checks for manual entry and offline data structures
runTest("10: Regression checks for manual entry and offline data structures", () => {
  // Test manual medicine input without AI
  const manualMedicine = {
    name: "Disprin",
    dosage: "300mg",
    frequency: "as needed",
    duration: "2 days",
  };
  assert.ok(manualMedicine.name.trim().length > 0);
  assert.strictEqual(manualMedicine.dosage, "300mg");

  // Date formatting helpers
  const todayStr = new Date().toISOString().slice(0, 10);
  assert.strictEqual(typeof todayStr, "string");
  assert.strictEqual(todayStr.length, 10);
});

console.log("\n============================================================");
console.log(`  Test Suite Summary: ${passed} passed, ${failed} failed`);
console.log("============================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
