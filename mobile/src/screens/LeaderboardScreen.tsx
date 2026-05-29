import { Text, View } from "react-native";

export function LeaderboardScreen() {
  return <View style={styles.page}>{["1. Priya 9.2", "2. Rahul 8.4", "3. Amit 8.1"].map((x) => <Text key={x} style={styles.row}>{x}</Text>)}</View>;
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, row: { color: "#f9fafb", backgroundColor: "#111827", padding: 14, borderRadius: 8, marginBottom: 8 } };
