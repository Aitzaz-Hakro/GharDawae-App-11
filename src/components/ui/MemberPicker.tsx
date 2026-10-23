import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/constants/useColors";
import type { Member } from "@/lib/family";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { FontSizes, Fonts, Radii } from "@/constants/theme";

/**
 * A short member chooser for actions that need a subject before they can
 * continue (new record, camera). Native-feeling slide-up, obvious cancel.
 */
export function MemberPicker({
  visible,
  members,
  title = "Who is this for?",
  onSelect,
  onClose,
  onAddMember,
}: {
  visible: boolean;
  members: Member[];
  title?: string;
  onSelect: (member: Member) => void;
  onClose: () => void;
  onAddMember?: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close member picker"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.surface,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
                {title}
              </Text>
              <Text style={[styles.body, { color: c.textSecondary }]}>
                Choose the person this prescription belongs to.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: c.surfaceSelected },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="x" size={20} color={c.text} />
            </Pressable>
          </View>

          {members.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                No family members yet
              </Text>
              <Text style={[styles.body, { color: c.textSecondary }]}>
                Add someone first, then you can attach prescriptions to them.
              </Text>
              {onAddMember ? (
                <PressableScale
                  onPress={onAddMember}
                  accessibilityRole="button"
                  accessibilityLabel="Add a family member"
                  style={[styles.addButton, { backgroundColor: c.primary }]}
                >
                  <Icon name="plus" size={18} color={c.onPrimary} />
                  <Text style={[styles.addText, { color: c.onPrimary }]}>
                    Add member
                  </Text>
                </PressableScale>
              ) : null}
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {members.map((member) => (
                <PressableScale
                  key={member.id}
                  onPress={() => onSelect(member)}
                  accessibilityRole="button"
                  accessibilityLabel={`${member.name}${member.relation ? `, ${member.relation}` : ""}`}
                  style={[styles.row, { borderColor: c.border }]}
                >
                  <Avatar
                    name={member.name}
                    type={member.avatar_type}
                    value={member.avatar_value}
                    size={44}
                  />
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text
                      style={[styles.rowMeta, { color: c.textSecondary }]}
                      numberOfLines={1}
                    >
                      {member.relation ?? "Family member"}
                    </Text>
                  </View>
                  <Icon name="caret-right" size={18} color={c.textSecondary} />
                </PressableScale>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(20, 14, 8, 0.42)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headCopy: { flex: 1, gap: 4 },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.title,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    lineHeight: 21,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.78 },
  list: { marginTop: 16 },
  listContent: { gap: 8, paddingBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    minHeight: 64,
  },
  rowCopy: { flex: 1, gap: 1 },
  rowTitle: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.label,
    textTransform: "capitalize",
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.heading,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
    marginTop: 8,
  },
  addText: {
    fontFamily: Fonts.headingSemi,
    fontSize: FontSizes.body,
  },
});
