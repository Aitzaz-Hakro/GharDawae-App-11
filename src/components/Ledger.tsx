import { useMemo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { FontSizes, FontWeights, Ledger } from "@/constants/theme";

/**
 * The signature device of the app (docs/design-system.md).
 *
 * A medicine is ALWAYS one line in one order — name, dose, frequency,
 * duration — whether it appears under a member on the family screen, as a
 * search hit, or inside a record. A caretaker learns the shape once and then
 * reads it by position, which is why this is a component and not three
 * hand-rolled rows.
 */
export type MedicineLineProps = {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  /** Large enough for a list row; `large` for record detail. */
  size?: "default" | "large";
  /** Shown when every detail column is empty. */
  fallback?: string;
};

export function MedicineLine({
  name,
  dosage,
  frequency,
  duration,
  size = "default",
  fallback = "No dosage noted",
}: MedicineLineProps) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c, size), [c, size]);
  const hasDetail = Boolean(dosage || frequency || duration);

  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {hasDetail ? (
        <View style={styles.columns}>
          <Text style={styles.cell} numberOfLines={1}>
            {dosage || "—"}
          </Text>
          <Text style={styles.cell} numberOfLines={1}>
            {frequency || "—"}
          </Text>
          <Text style={styles.cell} numberOfLines={1}>
            {duration || "—"}
          </Text>
        </View>
      ) : (
        <Text style={styles.fallback}>{fallback}</Text>
      )}
    </View>
  );
}

/**
 * One dated block in the ledger: the date and doctor sit on a rule, and the
 * prescription's medicine lines hang beneath it.
 */
export function DateRule({
  dateLabel,
  doctor,
}: {
  dateLabel: string;
  doctor?: string | null;
}) {
  const c = useColors();
  const styles = useMemo(() => makeRuleStyles(c), [c]);

  return (
    <View style={styles.wrap} accessible accessibilityRole="header">
      <View style={styles.line}>
        <Text style={styles.date}>{dateLabel}</Text>
        {doctor ? (
          <Text style={styles.doctor} numberOfLines={1}>
            {doctor}
          </Text>
        ) : null}
      </View>
      <View style={styles.rule} />
    </View>
  );
}

const makeStyles = (c: ThemePalette, size: "default" | "large") =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: Ledger.medicineRowMinHeight,
      paddingVertical: size === "large" ? 12 : 8,
      gap: Ledger.columnGap,
      borderBottomWidth: Ledger.rule,
      borderBottomColor: c.border,
    },
    name: {
      flex: 1,
      fontSize: size === "large" ? FontSizes.heading : FontSizes.body,
      fontWeight: FontWeights.heading,
      color: c.text,
    },
    columns: { flexDirection: "row", gap: Ledger.columnGap, alignItems: "center" },
    cell: {
      fontSize: FontSizes.label,
      fontWeight: FontWeights.label,
      color: c.textSecondary,
      fontVariant: ["tabular-nums"],
      minWidth: 34,
      textAlign: "right",
    },
    fallback: {
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      fontStyle: "italic",
    },
  });

const makeRuleStyles = (c: ThemePalette) =>
  StyleSheet.create({
    wrap: { paddingTop: 20 },
    line: { flexDirection: "row", alignItems: "baseline", gap: 12, paddingBottom: 6 },
    date: {
      fontSize: FontSizes.label,
      fontWeight: "700",
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
    doctor: {
      flex: 1,
      fontSize: FontSizes.caption,
      fontWeight: FontWeights.label,
      color: c.textSecondary,
      textAlign: "right",
    },
    rule: { height: Ledger.rule, backgroundColor: c.border },
  });

/**
 * One prescription as a dated ledger entry: date and doctor on a rule, the
 * slip's thumbnail on that rule's right edge, then the medicine lines beneath.
 * The whole block is one tap target.
 */
export function LedgerRecord({
  dateLabel,
  doctor,
  medicines,
  thumb,
  emptyNote,
  onPress,
  accessibilityLabel,
}: {
  dateLabel: string;
  doctor?: string | null;
  medicines: { id: string; name: string; dosage: string | null; frequency: string | null; duration: string | null }[];
  /** Photo thumbnail node; rendered at the right of the date rule. */
  thumb?: ReactNode;
  emptyNote?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const c = useColors();
  const styles = useMemo(() => makeRecordStyles(c), [c]);

  const body = (
    <>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.date}>{dateLabel}</Text>
          {doctor ? (
            <Text style={styles.doctor} numberOfLines={1}>
              {doctor}
            </Text>
          ) : null}
        </View>
        {thumb}
      </View>
      <View style={styles.headRule} />
      {medicines.length > 0 ? (
        medicines.map((m) => (
          <MedicineLine
            key={m.id}
            name={m.name}
            dosage={m.dosage}
            frequency={m.frequency}
            duration={m.duration}
          />
        ))
      ) : (
        <Text style={styles.emptyNote}>{emptyNote ?? "No medicines recorded"}</Text>
      )}
    </>
  );

  if (!onPress) return <View style={styles.block}>{body}</View>;

  return (
    <Pressable
      style={styles.block}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </Pressable>
  );
}

const makeRecordStyles = (c: ThemePalette) =>
  StyleSheet.create({
    block: { paddingTop: 22 },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingBottom: 8,
    },
    headText: { flex: 1, gap: 2 },
    date: {
      fontSize: FontSizes.label,
      fontWeight: "700",
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
    doctor: {
      fontSize: FontSizes.caption,
      fontWeight: FontWeights.label,
      color: c.textSecondary,
    },
    headRule: { height: Ledger.rule, backgroundColor: c.border },
    emptyNote: {
      fontSize: FontSizes.label,
      color: c.textSecondary,
      paddingVertical: 10,
      fontStyle: "italic",
    },
  });
