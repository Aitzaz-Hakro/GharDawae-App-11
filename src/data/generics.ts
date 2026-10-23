// Indicative Pakistani brand → generic price map.
//
// Prices are approximate retail pack prices in PKR and change constantly.
// The UI always labels them as indicative and tells the user to confirm at a
// pharmacy. This is not a clinical recommendation: same salt ≠ automatically
// interchangeable for every patient (some have different release profiles).

export type GenericEntry = {
  brand: string;
  salt: string;
  strength: string;
  pack: string;
  genericName: string;
  brandPrice: number;
  genericPrice: number;
};

export const GENERICS: GenericEntry[] = [
  { brand: "Panadol", salt: "Paracetamol", strength: "500 mg", pack: "20 tablets", genericName: "Paracetamol", brandPrice: 140, genericPrice: 50 },
  { brand: "Panadol Extra", salt: "Paracetamol + Caffeine", strength: "500/65 mg", pack: "20 tablets", genericName: "Paracetamol + Caffeine", brandPrice: 190, genericPrice: 80 },
  { brand: "Calpol", salt: "Paracetamol", strength: "120 mg/5 ml", pack: "60 ml syrup", genericName: "Paracetamol syrup", brandPrice: 185, genericPrice: 85 },
  { brand: "Febrinil", salt: "Paracetamol", strength: "500 mg", pack: "20 tablets", genericName: "Paracetamol", brandPrice: 120, genericPrice: 50 },
  { brand: "Augmentin", salt: "Amoxicillin + Clavulanic acid", strength: "625 mg", pack: "6 tablets", genericName: "Co-amoxiclav", brandPrice: 720, genericPrice: 330 },
  { brand: "Amoxil", salt: "Amoxicillin", strength: "500 mg", pack: "12 capsules", genericName: "Amoxicillin", brandPrice: 310, genericPrice: 125 },
  { brand: "Azomax", salt: "Azithromycin", strength: "500 mg", pack: "3 tablets", genericName: "Azithromycin", brandPrice: 390, genericPrice: 155 },
  { brand: "Ciproxin", salt: "Ciprofloxacin", strength: "500 mg", pack: "10 tablets", genericName: "Ciprofloxacin", brandPrice: 460, genericPrice: 185 },
  { brand: "Velosef", salt: "Cephradine", strength: "500 mg", pack: "12 capsules", genericName: "Cephradine", brandPrice: 430, genericPrice: 170 },
  { brand: "Flagyl", salt: "Metronidazole", strength: "400 mg", pack: "10 tablets", genericName: "Metronidazole", brandPrice: 190, genericPrice: 75 },
  { brand: "Risek", salt: "Omeprazole", strength: "20 mg", pack: "14 capsules", genericName: "Omeprazole", brandPrice: 250, genericPrice: 95 },
  { brand: "Nexum", salt: "Esomeprazole", strength: "20 mg", pack: "14 capsules", genericName: "Esomeprazole", brandPrice: 330, genericPrice: 125 },
  { brand: "Motilium", salt: "Domperidone", strength: "10 mg", pack: "30 tablets", genericName: "Domperidone", brandPrice: 250, genericPrice: 95 },
  { brand: "Buscopan", salt: "Hyoscine butylbromide", strength: "10 mg", pack: "20 tablets", genericName: "Hyoscine butylbromide", brandPrice: 230, genericPrice: 85 },
  { brand: "Glucophage", salt: "Metformin", strength: "500 mg", pack: "30 tablets", genericName: "Metformin", brandPrice: 230, genericPrice: 85 },
  { brand: "Diamicron", salt: "Gliclazide", strength: "80 mg", pack: "30 tablets", genericName: "Gliclazide", brandPrice: 290, genericPrice: 115 },
  { brand: "Amlor", salt: "Amlodipine", strength: "5 mg", pack: "30 tablets", genericName: "Amlodipine", brandPrice: 270, genericPrice: 95 },
  { brand: "Tenormin", salt: "Atenolol", strength: "50 mg", pack: "30 tablets", genericName: "Atenolol", brandPrice: 210, genericPrice: 75 },
  { brand: "Concor", salt: "Bisoprolol", strength: "5 mg", pack: "30 tablets", genericName: "Bisoprolol", brandPrice: 310, genericPrice: 125 },
  { brand: "Zestril", salt: "Lisinopril", strength: "10 mg", pack: "30 tablets", genericName: "Lisinopril", brandPrice: 290, genericPrice: 105 },
  { brand: "Cozaar", salt: "Losartan", strength: "50 mg", pack: "30 tablets", genericName: "Losartan", brandPrice: 430, genericPrice: 155 },
  { brand: "Lipitor", salt: "Atorvastatin", strength: "20 mg", pack: "30 tablets", genericName: "Atorvastatin", brandPrice: 490, genericPrice: 185 },
  { brand: "Crestor", salt: "Rosuvastatin", strength: "10 mg", pack: "30 tablets", genericName: "Rosuvastatin", brandPrice: 530, genericPrice: 205 },
  { brand: "Ventolin", salt: "Salbutamol", strength: "100 mcg", pack: "inhaler", genericName: "Salbutamol inhaler", brandPrice: 490, genericPrice: 225 },
  { brand: "Zyrtec", salt: "Cetirizine", strength: "10 mg", pack: "10 tablets", genericName: "Cetirizine", brandPrice: 190, genericPrice: 65 },
  { brand: "Aerius", salt: "Desloratadine", strength: "5 mg", pack: "10 tablets", genericName: "Desloratadine", brandPrice: 270, genericPrice: 95 },
  { brand: "Claritin", salt: "Loratadine", strength: "10 mg", pack: "10 tablets", genericName: "Loratadine", brandPrice: 210, genericPrice: 75 },
  { brand: "Brufen", salt: "Ibuprofen", strength: "400 mg", pack: "10 tablets", genericName: "Ibuprofen", brandPrice: 170, genericPrice: 60 },
  { brand: "Voltral", salt: "Diclofenac sodium", strength: "50 mg", pack: "10 tablets", genericName: "Diclofenac", brandPrice: 190, genericPrice: 65 },
  { brand: "Ponstan", salt: "Mefenamic acid", strength: "250 mg", pack: "10 capsules", genericName: "Mefenamic acid", brandPrice: 170, genericPrice: 65 },
  { brand: "Arcoxia", salt: "Etoricoxib", strength: "90 mg", pack: "7 tablets", genericName: "Etoricoxib", brandPrice: 430, genericPrice: 165 },
  { brand: "Surbex Z", salt: "Multivitamin + Zinc", strength: "—", pack: "30 tablets", genericName: "Multivitamin + Zinc", brandPrice: 460, genericPrice: 185 },
  { brand: "Neurobion", salt: "Vitamin B complex", strength: "—", pack: "30 tablets", genericName: "Vitamin B complex", brandPrice: 390, genericPrice: 155 },
  { brand: "Calcium Sandoz", salt: "Calcium + Vitamin D", strength: "500 mg", pack: "10 tablets", genericName: "Calcium + Vitamin D", brandPrice: 290, genericPrice: 115 },
  { brand: "Actifed", salt: "Triprolidine + Pseudoephedrine", strength: "—", pack: "10 tablets", genericName: "Triprolidine + Pseudoephedrine", brandPrice: 210, genericPrice: 85 },
  { brand: "Hydrillin", salt: "Diphenhydramine", strength: "25 mg", pack: "10 capsules", genericName: "Diphenhydramine", brandPrice: 160, genericPrice: 65 },
];

export type GenericMatch = {
  entry: GenericEntry;
  saving: number;
  percent: number;
};

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+]/g, "");
}

function savingOf(entry: GenericEntry): number {
  return Math.max(0, entry.brandPrice - entry.genericPrice);
}

/**
 * Match by brand first (the prescription usually names the brand), then by
 * active ingredient. Brand matching requires a prefix so "Panadol" does not
 * match an unrelated longer name.
 */
export function findGeneric(
  name: string,
  activeIngredient?: string | null,
): GenericMatch | null {
  const brandKey = norm(name);
  if (brandKey) {
    const byBrand = GENERICS.find((entry) => {
      const key = norm(entry.brand);
      return brandKey === key || brandKey.startsWith(key);
    });
    if (byBrand) {
      return {
        entry: byBrand,
        saving: savingOf(byBrand),
        percent: Math.round((savingOf(byBrand) / byBrand.brandPrice) * 100),
      };
    }
  }

  const saltKey = activeIngredient ? norm(activeIngredient) : "";
  if (saltKey) {
    const bySalt = GENERICS.find((entry) => norm(entry.salt) === saltKey);
    if (bySalt) {
      return {
        entry: bySalt,
        saving: savingOf(bySalt),
        percent: Math.round((savingOf(bySalt) / bySalt.brandPrice) * 100),
      };
    }
  }

  return null;
}

export type SavingsSummary = {
  count: number;
  brandedTotal: number;
  genericTotal: number;
  saving: number;
  percent: number;
};

export function summarizeSavings(
  items: { name: string; activeIngredient?: string | null }[],
): SavingsSummary | null {
  const seen = new Set<string>();
  let brandedTotal = 0;
  let genericTotal = 0;
  let count = 0;

  for (const item of items) {
    const match = findGeneric(item.name, item.activeIngredient);
    if (!match || seen.has(match.entry.brand)) continue;
    seen.add(match.entry.brand);
    brandedTotal += match.entry.brandPrice;
    genericTotal += match.entry.genericPrice;
    count += 1;
  }

  if (count === 0) return null;
  const saving = brandedTotal - genericTotal;
  return {
    count,
    brandedTotal,
    genericTotal,
    saving,
    percent:
      brandedTotal > 0 ? Math.round((saving / brandedTotal) * 100) : 0,
  };
}

export function formatRupees(amount: number): string {
  return `Rs ${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
