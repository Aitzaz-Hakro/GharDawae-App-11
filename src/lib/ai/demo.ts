// Offline demo data.
//
// A live hackathon demo cannot depend on venue Wi-Fi. "Try a sample" renders
// these through the exact same UI as a real model response, with no network.

import type {
  AssistantReply,
  FoodAnalysis,
  PrescriptionExtraction,
} from "./types";

export function demoPrescriptionExtraction(): PrescriptionExtraction {
  return {
    raw_text:
      "Dr. Ahmed Raza\nDate: 18-10-2026\n\nTab Augmentin 625mg  1+0+1  x 7 days (after food)\nTab Panadol 500mg    1+1+1  x 3 days\nTab Febrinil 500mg   1+0+1  x 3 days\nCap Risek 20mg       1+0+0  x 14 days (before breakfast)\n\nFollow up after 7 days.",
    doctor_name: "Dr. Ahmed Raza",
    visit_date: "2026-10-18",
    diagnosis: "Chest infection",
    medicines: [
      {
        name: "Augmentin",
        active_ingredient: "Amoxicillin + Clavulanic acid",
        strength: "625 mg",
        dosage: "1 tablet",
        frequency: "Morning + Night",
        duration: "7 days",
        times: ["morning", "night"],
        with_food: "after",
        warnings: ["Complete the full 7-day course, even if you feel better."],
        confidence: 0.88,
      },
      {
        name: "Panadol",
        active_ingredient: "Paracetamol",
        strength: "500 mg",
        dosage: "1 tablet",
        frequency: "Morning + Afternoon + Night",
        duration: "3 days",
        times: ["morning", "afternoon", "night"],
        with_food: "after",
        warnings: [],
        confidence: 0.94,
      },
      {
        name: "Febrinil",
        active_ingredient: "Paracetamol",
        strength: "500 mg",
        dosage: "1 tablet",
        frequency: "Morning + Night",
        duration: "3 days",
        times: ["morning", "night"],
        with_food: "after",
        warnings: [],
        confidence: 0.62,
      },
      {
        name: "Risek",
        active_ingredient: "Omeprazole",
        strength: "20 mg",
        dosage: "1 capsule",
        frequency: "Morning",
        duration: "14 days",
        times: ["morning"],
        with_food: "before",
        warnings: ["Take before breakfast."],
        confidence: 0.81,
      },
    ],
    warnings: [
      "Panadol and Febrinil both contain paracetamol. Taking both can exceed the safe daily dose.",
      "Augmentin is an antibiotic — complete the full course.",
      "Risek should be taken before breakfast.",
    ],
    urdu_summary:
      "یہ نسخہ سینے کے انفیکشن کے لیے ہے۔ صبح اور رات کھانے کے بعد ایک گولی Augmentin لیں، سات دن تک مکمل کریں۔ Panadol اور Febrinil دونوں میں ایک ہی دوا ہے، اس لیے دونوں ایک ساتھ نہ لیں۔ Risek ناشتے سے پہلے لیں۔ کوئی بھی دوا بند کرنے سے پہلے ڈاکٹر سے پوچھیں۔",
    sindhi_summary: null,
    overall_confidence: 0.81,
  };
}

export function demoFoodAnalysis(): FoodAnalysis {
  return {
    verdict: "moderate",
    headline: "Chicken biryani is fine in a small portion, but not every day.",
    reasons: [
      "It gives protein and energy, so it is not a bad choice on its own.",
      "A usual plate is high in white rice and oil, which raises blood sugar quickly.",
    ],
    concerns: [
      "If this person takes metformin for diabetes, a large rice portion can push sugar up within an hour.",
      "Salty sides and pickles can raise blood pressure, especially with amlodipine.",
    ],
    swaps: [
      {
        from: "Full plate of biryani",
        to: "Half plate + cucumber salad",
        why: "Less rice and more fibre keeps the sugar rise gentler.",
      },
      {
        from: "Fried chicken piece",
        to: "Grilled or boiled chicken",
        why: "Same protein with much less oil.",
      },
    ],
    portion_note: "One small cup of rice (about 150 g cooked) is a safer portion.",
    urdu_summary:
      "چکن بریانی تھوڑی مقدار میں ٹھیک ہے، روزانہ نہیں۔ چاول زیادہ کھانے سے شوگر تیزی سے بڑھ سکتی ہے۔ آدھی پلیٹ کے ساتھ ککڑی اور سلاد لیں، اور تلی ہوئی چکن کی جگہ بھنی ہوئی چکن کھائیں۔ نمک اور اچار کم رکھیں۔",
    confidence: 0.78,
  };
}

export function demoPrescriptionReply(): AssistantReply {
  return {
    kind: "prescription",
    text: "I read this prescription. Please check the flagged medicine before saving.",
    prescription: demoPrescriptionExtraction(),
  };
}

export function demoFoodReply(): AssistantReply {
  return {
    kind: "food",
    text: "Here is what I can tell from the food photo.",
    food: demoFoodAnalysis(),
  };
}

export function demoTextReply(): AssistantReply {
  return {
    kind: "text",
    text: "I can read a prescription photo or check a food photo. Tap the + button and choose one. I give general guidance only — not a diagnosis and not medical advice.",
  };
}
