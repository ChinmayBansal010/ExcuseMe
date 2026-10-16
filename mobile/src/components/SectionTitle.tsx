import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, gap: 4 },
  title: { color: colors.text, fontSize: 18, fontWeight: "700" },
  detail: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
