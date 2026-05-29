import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export function AIChatScreen() {
  const [msg, setMsg] = useState("");
  return <View style={styles.page}><Text style={styles.bubble}>Guru: Ready to learn?</Text><TextInput value={msg} onChangeText={setMsg} placeholder="Ask Guru..." placeholderTextColor="#6b7280" style={styles.input} /><Pressable style={styles.button}><Text>Send</Text></Pressable></View>;
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, bubble: { backgroundColor: "#312e81", color: "#f9fafb", padding: 14, borderRadius: 8 }, input: { backgroundColor: "#111827", color: "#f9fafb", padding: 14, borderRadius: 8, marginTop: "auto" as const }, button: { backgroundColor: "#4ade80", padding: 12, borderRadius: 8, marginTop: 8, alignItems: "center" as const } };
