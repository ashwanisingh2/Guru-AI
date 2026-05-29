import { Text, View } from "react-native";

export function ProfileSettingsScreen() {
  return <View style={styles.page}><Text style={styles.text}>Profile & Settings</Text><Text style={styles.muted}>Dark mode, low-data mode, language, push settings.</Text></View>;
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, text: { color: "#f9fafb", fontSize: 22 }, muted: { color: "#6b7280", marginTop: 8 } };
