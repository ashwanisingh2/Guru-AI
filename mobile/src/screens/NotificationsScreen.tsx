import { Text, View } from "react-native";

export function NotificationsScreen() {
  return <View style={styles.page}>{["Study reminder", "Streak warning", "CSS badge unlocked"].map((x) => <Text key={x} style={styles.row}>{x}</Text>)}</View>;
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, row: { color: "#f9fafb", backgroundColor: "#111827", padding: 14, borderRadius: 8, marginBottom: 8 } };
