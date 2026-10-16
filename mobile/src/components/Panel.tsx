import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";

export function Panel({ children, style }: PropsWithChildren<{ style?: object }>) {
  const { colors } = useAppTheme();
  return <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.border }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#13171D",
    borderColor: "#2A323D",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
});
