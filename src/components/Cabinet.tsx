import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts, Radii } from "@/constants/theme";

/**
 * The Warm Cabinet record block and its medicine grammar
 * (docs/design-system.md §4).
 *
 * A medicine is always the same four facts in the same order — name, dosage,
 * frequency, duration. Density changes with the surface: a chip on a member's
 * record block, a full card on the record itself, a compact row in search. The
 * facts and their order never change, so a caretaker learns the object once.
 */

export type Medicine = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
};

/** Compact form: `Amlodipine 5mg`. Used on record blocks and search hits. */
export function MedicineChip({ medicine }: { medicine: Medicine }) {
  const c = useColors();
  const styles = useMemo(() => makeChipStyles(c), [c]);
  const detail = [medicine.name, medicine.dosage].filter(Boolean).join(" ");

  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        {detail || medicine.name}
      </Text>
    </View>
  );
}

/**
 * Full form: name and duration on a line, then dosage and frequency as two
 * labelled wells. Used where the medicine is the subject, not an annotation.
 */
export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const c = useColors();
  const styles = useMemo(() => makeCardStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name} numberOfLines={2}>
          {medicine.name}
        </Text>
        {medicine.duration ? (
          <Text style={styles.duration}>{medicine.duration}</Text>
        ) : null}
      </View>
      <View style={styles.wells}>
        <View style={styles.well}>
          <Text style={styles.wellLabel}>Dosage</Text>
          <Text style={styles.wellValue} numberOfLines={1}>
            {medicine.dosage || "—"}
          </Text>
        </View>
        <View style={styles.well}>
          <Text style={styles.wellLabel}>Frequency</Text>
          <Text style={styles.wellValue} numberOfLines={1}>
            {medicine.frequency || "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * One prescription as a Warm Cabinet card: the visit date is the largest
 * element, the doctor sits beneath it, and the medicines are chips. The left
 * edge carries the member's colour, so a family's records stay recognisable
 * when read in a list.
 */
export function RecordBlock({
  dateLabel,
  doctor,
  medicines,
  accentColor,
  emptyNote,
  onPress,
  accessibilityLabel,
}: {
  dateLabel: string;
  doctor?: string | null;
  medicines: Medicine[];
  /** The member's avatar fill — the block's left edge. */
  accentColor: string;
  emptyNote?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const c = useColors();
  const styles = useMemo(() => makeBlockStyles(c, accentColor), [c, accentColor]);

  const body = (
    <>
      <Text style={styles.dateLabel}>Visit date</Text>
      <Text style={styles.date}>{dateLabel}</Text>
      {doctor ? (
        <Text style={styles.doctor} numberOfLines={2}>
          {doctor}
        </Text>
      ) : null}
      {medicines.length > 0 ? (
        <View style={styles.chips}>
          {medicines.map((m) => (
            <MedicineChip key={m.id} medicine={m} />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyNote}>{emptyNote ?? "No medicines recorded"}</Text>
      )}
    </>
  );

  if (!onPress) return <View style={styles.block}>{body}</View>;

  return (
    <Pressable
      style={({ pressed }) => [styles.block, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </Pressable>
  );
}

const makeChipStyles = (c: ThemePalette) =>
  StyleSheet.create({
    chip: {
      borderRadius: Radii.pill,
      backgroundColor: c.surfaceSelected,
      paddingHorizontal: 12,
      paddingVertical: 4,
      maxWidth: "100%",
    },
    chipText: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
    },
  });

const makeCardStyles = (c: ThemePalette) =>
  StyleSheet.create({
    card: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 16,
      gap: 12,
    },
    head: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    name: {
      flex: 1,
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.heading,
      color: c.text,
    },
    duration: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    wells: { flexDirection: "row", gap: 12 },
    well: {
      flex: 1,
      borderRadius: Radii.md,
      backgroundColor: c.surfaceSelected,
      padding: 12,
      gap: 2,
    },
    wellLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    wellValue: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.title,
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
  });

const makeBlockStyles = (c: ThemePalette, accentColor: string) =>
  StyleSheet.create({
    block: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: Cabinet.edgeWidth,
      borderLeftColor: accentColor,
      backgroundColor: c.surface,
      padding: 16,
      gap: 2,
    },
    pressed: { opacity: 0.85 },
    dateLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
    },
    date: {
      fontFamily: Fonts.headingBold,
      fontSize: FontSizes.recordDate,
      color: c.text,
      fontVariant: ["tabular-nums"],
      letterSpacing: -0.4,
    },
    doctor: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.text,
      marginTop: 4,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    emptyNote: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.body,
      color: c.textSecondary,
      marginTop: 12,
    },
  });

/** Exported for screens that need the same chip outside a record block. */
export type { Medicine as MedicineRecord };
