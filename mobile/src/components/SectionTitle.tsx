import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeContext";

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {detail ? <Text style={[styles.detail, { color: colors.muted }]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, gap: 4 },
  title: { color: "#F2F3EF", fontSize: 18, fontWeight: "700" },
  detail: { color: "#929BA7", fontSize: 12, lineHeight: 18 },
});
