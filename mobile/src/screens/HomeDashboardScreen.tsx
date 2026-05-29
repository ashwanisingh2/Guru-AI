import { Text, View } from "react-native";

export function HomeDashboardScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.h1}>Good Evening, Rahul</Text>
      <View style={styles.grid}>
        <Card title="12" sub="Day Streak" />
        <Card title="8.4" sub="CGPA /10" />
        <Card title="#15" sub="Rank" />
      </View>
      <Text style={styles.section}>Full-Stack Developer: 78%</Text>
      <Text style={styles.mentor}>Rahul, JS closures tricky hai? Main hoon na.</Text>
    </View>
  );
}

function Card({ title, sub }: { title: string; sub: string }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.muted}>{sub}</Text></View>;
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, h1: { color: "#f9fafb", fontSize: 24, fontWeight: "700" as const }, grid: { flexDirection: "row" as const, gap: 8, marginTop: 16 }, card: { flex: 1, backgroundColor: "#111827", borderColor: "#1f2937", borderWidth: 1, padding: 12, borderRadius: 8 }, cardTitle: { color: "#4ade80", fontSize: 20 }, muted: { color: "#6b7280" }, section: { color: "#f9fafb", marginTop: 24, fontSize: 18 }, mentor: { color: "#c7d2fe", backgroundColor: "#312e81", padding: 14, borderRadius: 8, marginTop: 16 } };
