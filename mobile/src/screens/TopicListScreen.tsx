import { Pressable, Text, View } from "react-native";

const topics = ["HTML ✅", "CSS ✅", "JavaScript 🔄", "React 🔒", "Node 🔒"];

export function TopicListScreen({ navigation }: any) {
  return <View style={styles.page}>{topics.map((t) => <Pressable key={t} onPress={() => !t.includes("🔒") && navigation.navigate("Video", { contentId: t, url: "https://example.com/video.mp4" })} style={styles.row}><Text style={styles.text}>{t}</Text></Pressable>)}</View>;
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, row: { backgroundColor: "#111827", borderColor: "#1f2937", borderWidth: 1, padding: 16, borderRadius: 8, marginBottom: 10 }, text: { color: "#f9fafb" } };
