// English strings. Add a key here first, then translate it in ur.ts.

const en = {
  // common
  "app.name": "Ghar Dawae",
  "common.cancel": "Cancel",
  "common.retry": "Retry",
  "common.save": "Save record",
  "common.saving": "Saving…",
  "common.language": "Language",

  // home
  "home.title": "Our Family",
  "home.search": "Search people, records, medicines",
  "home.familyMembers": "Family members",
  "home.person": "person",
  "home.people": "people",
  "home.prescription": "prescription",
  "home.prescriptions": "prescriptions",
  "home.addMember": "Add member",
  "home.emptyTitle": "No family members yet",
  "home.emptyBody":
    "Add the people you care for — Ammi, Baba, the kids — then photograph their prescriptions as you go.",
  "home.addFirst": "Add your first member",
  "home.askAi": "Ask AI",
  "home.askAiTitle": "Check food or read a prescription",
  "home.askAiBody": "Snap a photo. AI explains it in plain language.",

  // member
  "member.askAbout": "Ask AI about",
  "member.visitHistory": "Visit history",
  "member.newRecord": "New record",

  // assistant
  "assistant.title": "AI Assistant",
  "assistant.general": "General",
  "assistant.empty": "Send a photo or ask a question.",
  "assistant.placeholder": "Ask about a medicine or food…",
  "assistant.send": "Send",
  "assistant.thinking": "Thinking…",
  "assistant.attach": "Attach a photo",
  "assistant.foodPhoto": "Food photo",
  "assistant.prescriptionPhoto": "Prescription photo",
  "assistant.checkFood": "Check a food photo",
  "assistant.readPrescription": "Read a prescription",
  "assistant.trySample": "Try a sample",
  "assistant.failed": "That didn't go through.",
  "assistant.generalContext": "General guidance",
  "assistant.basedOn": "Based on",
  "assistant.suggest1": "Is biryani okay for Ammi?",
  "assistant.suggest2": "What is this medicine for?",
  "assistant.suggest3": "Can I take these together?",
  "assistant.reviewAndSave": "Review & save",
  "assistant.selectMember": "Select a family member above first.",
  "assistant.record": "Speak instead of typing",
  "assistant.stopRecording": "Stop recording",
  "assistant.recording": "Listening…",
  "assistant.transcribing": "Transcribing…",
  "assistant.micDenied": "Microphone permission is needed to dictate.",
  "assistant.sttNotConfigured": "Speech-to-text is not configured.",
  "assistant.sttFailed": "Could not transcribe that.",
  "assistant.disclaimer": "General guidance, not medical advice.",

  // food card
  "food.good": "Good",
  "food.moderate": "In moderation",
  "food.avoid": "Best avoided",
  "food.why": "Why",
  "food.watchOut": "Watch out for",
  "food.swaps": "Try this instead",
  "food.portion": "Portion",
  "food.lowConfidence": "Low confidence — check the photo.",

  // review
  "review.reading": "Reading the prescription…",
  "review.read": "AI read this",
  "review.failed": "Couldn't read this prescription",
  "review.notConfigured": "AI is not configured yet",
  "review.checkThis": "Check this",
  "review.medicinesFound": "medicines found",
  "review.warnings": "Warnings",
  "review.whatAiRead": "What the AI read",
  "review.consent": "Photos are sent to Google Gemini to be read.",
  "review.disclaimer":
    "AI can misread handwriting. Check everything before saving. This is not medical advice.",
  "review.lowConfidence": "Low confidence — check this",
  "review.schedule": "Dose schedule",
  "review.morning": "Morning",
  "review.afternoon": "Afternoon",
  "review.night": "Night",
  "review.generic": "Cheaper alternative",
  "review.savingsNote": "Indicative prices — confirm at your pharmacist.",
  "review.genericTotal": "Generic total",
  "review.branded": "Branded",
  "review.genericLabel": "Generic",
  "review.saveAmount": "save",

  // record form
  "record.doctor": "Doctor",
  "record.doctorPlaceholder": "e.g. Dr. Ahmed",
  "record.visitDate": "Visit date",
  "record.diagnosis": "Diagnosis",
  "record.diagnosisPlaceholder": "e.g. Viral fever",
  "record.medicines": "Medicines",
  "record.medicineName": "Medicine name",
  "record.dosage": "Dosage",
  "record.frequency": "Frequency",
  "record.duration": "Duration",
  "record.addMedicine": "Add another medicine",
  "record.notes": "Notes",
  "record.notesPlaceholder": "Anything else to remember",
  "record.photograph": "Photograph the prescription",
  "record.retake": "Retake",
  "record.removePhoto": "Remove photo",
  "record.nothingTitle": "Nothing to save yet",
  "record.nothingBody":
    "Add a photo of the prescription or at least one medicine.",
  "record.couldNotSave": "Could not save",

  // settings
  "settings.title": "Settings",
  "settings.english": "English",
  "settings.urdu": "Urdu",
  "settings.privacy": "Privacy & how your data is stored",
} as const;

export type StringKey = keyof typeof en;
export default en;
