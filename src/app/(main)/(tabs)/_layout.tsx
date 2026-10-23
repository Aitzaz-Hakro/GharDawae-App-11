import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/constants/useColors";
import { Icon, type IconName } from "@/components/Icon";
import { Fonts } from "@/constants/theme";

const TABS: {
  name: string;
  title: string;
  icon: IconName;
}[] = [
  { name: "index", title: "Home", icon: "house" },
  { name: "health", title: "Health", icon: "heart" },
  { name: "connect", title: "Family", icon: "users-three" },
  { name: "services", title: "Services", icon: "squares-four" },
  { name: "profile", title: "Profile", icon: "user-circle" },
];

/**
 * The care shell. The bar sits outside the scrolling content, uses real
 * navigation state for selection, and gets out of the way when a keyboard is
 * open (Android otherwise pushes it above the keys).
 */
export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 7),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyMedium,
          fontSize: 12,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIconStyle: { marginBottom: 1 },
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color }) => (
              <Icon name={tab.icon} size={23} color={String(color)} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
