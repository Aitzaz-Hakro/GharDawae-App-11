import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/constants/useColors";
import type { Member } from "@/lib/family";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

/**
 * The family row from the Connect design: one circular portrait, name, and
 * relationship per person, ending with an explicit "Add" target.
 */
export function AvatarRow({
  members,
  onSelect,
  onAdd,
}: {
  members: Member[];
  onSelect: (member: Member) => void;
  onAdd: () => void;
}) {
  const c = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {members.map((member) => (
        <PressableScale
          key={member.id}
          onPress={() => onSelect(member)}
          accessibilityRole="button"
          accessibilityLabel={`${member.name}${member.relation ? `, ${member.relation}` : ""}`}
          style={styles.person}
        >
          <View style={[styles.ring, { backgroundColor: c.surface }]}>
            <Avatar
              name={member.name}
              type={member.avatar_type}
              value={member.avatar_value}
              size={60}
            />
          </View>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {member.name}
          </Text>
          <Text style={[styles.meta, { color: c.textSecondary }]} numberOfLines={1}>
            {member.relation ?? "Family"}
          </Text>
        </PressableScale>
      ))}

      <PressableScale
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add a family member"
        style={styles.person}
      >
        <View
          style={[
            styles.ring,
            styles.addRing,
            { backgroundColor: c.mint, borderColor: c.border },
          ]}
        >
          <Icon name="plus" size={24} color={c.primary} />
        </View>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
          Add
        </Text>
        <Text style={[styles.meta, { color: c.textSecondary }]} numberOfLines={1}>
          New member
        </Text>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 14, paddingVertical: 4, paddingRight: 4 },
  person: { width: 78, alignItems: "center", gap: 2 },
  ring: {
    width: 68,
    height: 68,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  addRing: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  name: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.label,
    textAlign: "center",
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.caption,
    textAlign: "center",
  },
});
