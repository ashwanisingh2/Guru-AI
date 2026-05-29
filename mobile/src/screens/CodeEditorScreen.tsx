import { Pressable, Text, TextInput, View } from "react-native";
import { queueOfflineAction } from "../services/offlineSync";

export function CodeEditorScreen({ route }: any) {
  return (
    <View style={styles.page}>
      <TextInput multiline defaultValue={"function solve(input) {\n  return input;\n}"} style={styles.editor} />
      <Pressable style={styles.button} onPress={() => queueOfflineAction({ type: "coding_submit", problemId: route.params?.problemId, code: "queued" })}><Text>Submit / Sync Later</Text></Pressable>
    </View>
  );
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, editor: { minHeight: 360, color: "#f9fafb", backgroundColor: "#111827", borderColor: "#1f2937", borderWidth: 1, borderRadius: 8, padding: 12, fontFamily: "monospace" }, button: { backgroundColor: "#4ade80", padding: 14, borderRadius: 8, marginTop: 16, alignItems: "center" as const } };
