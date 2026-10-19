import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";

export function Panel({ children, style }: PropsWithChildren<{ style?: object }>) {
  const { colors, isDark } = useAppTheme();
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.panel,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.045,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE3EE",
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#172033",
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 18,
    elevation: 2,
  },
});
