import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors, type ThemePalette } from "@/constants/useColors";
import { Cabinet, FontSizes, Fonts } from "@/constants/theme";
import { Icon, type IconName } from "@/components/Icon";
import { useLanguage } from "@/i18n";
import type { DoseTime, ExtractedMedicine } from "@/lib/ai/types";

const SLOTS: { time: DoseTime; icon: IconName; key: "review.morning" | "review.afternoon" | "review.night" }[] = [
  { time: "morning", icon: "sun", key: "review.morning" },
  { time: "afternoon", icon: "sun-horizon", key: "review.afternoon" },
  { time: "night", icon: "moon", key: "review.night" },
];

/** Morning / afternoon / night at a glance — the low-literacy centrepiece. */
export function ScheduleGrid({ medicines }: { medicines: ExtractedMedicine[] }) {
  const c = useColors();
  const { t, isUrdu } = useLanguage();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (medicines.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={[styles.title, isUrdu && styles.urdu]}>
        {t("review.schedule")}
      </Text>

      <View style={styles.headRow}>
        <View style={styles.nameCol} />
        {SLOTS.map((slot) => (
          <View key={slot.time} style={styles.slotHead}>
            <Icon name={slot.icon} size={18} color={c.textSecondary} />
            <Text style={[styles.slotLabel, isUrdu && styles.urdu]}>
              {t(slot.key)}
            </Text>
          </View>
        ))}
      </View>

      {medicines.map((medicine, index) => (
        <View
          key={`${medicine.name}-${index}`}
          style={[styles.row, index > 0 && styles.rowRule]}
        >
          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={1}>
              {medicine.name}
            </Text>
            {medicine.strength ? (
              <Text style={styles.strength}>{medicine.strength}</Text>
            ) : null}
          </View>
          {SLOTS.map((slot) => {
            const active = medicine.times.includes(slot.time);
            return (
              <View key={slot.time} style={styles.slot}>
                <View style={[styles.dot, active && styles.dotActive]}>
                  <Icon
                    name={slot.icon}
                    size={16}
                    color={active ? c.onPrimary : c.border}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    card: {
      borderRadius: Cabinet.blockRadius,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      padding: 16,
      marginTop: 16,
      gap: 10,
    },
    title: {
      fontFamily: Fonts.headingSemi,
      fontSize: FontSizes.label,
      color: c.text,
    },
    headRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
    nameCol: { flex: 1 },
    slotHead: { width: 52, alignItems: "center", gap: 2 },
    slotLabel: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
      textAlign: "center",
    },
    row: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8 },
    rowRule: { borderTopWidth: Cabinet.rule, borderTopColor: c.border },
    name: {
      fontFamily: Fonts.bodyMedium,
      fontSize: FontSizes.body,
      color: c.text,
    },
    strength: {
      fontFamily: Fonts.body,
      fontSize: FontSizes.caption,
      color: c.textSecondary,
    },
    slot: { width: 52, alignItems: "center" },
    dot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceSelected,
      borderWidth: 1,
      borderColor: c.border,
    },
    dotActive: { backgroundColor: c.primary, borderColor: c.primary },
    urdu: { textAlign: "right", writingDirection: "rtl" },
  });
