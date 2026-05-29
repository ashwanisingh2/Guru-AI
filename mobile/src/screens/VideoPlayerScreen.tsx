import { ResizeMode, Video } from "expo-av";
import { Pressable, Text, View } from "react-native";
import { downloadVideo, queueOfflineAction } from "../services/offlineSync";

export function VideoPlayerScreen({ route }: any) {
  const { contentId, url } = route.params;
  return (
    <View style={styles.page}>
      <Video source={{ uri: url }} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay style={styles.video} />
      <Pressable style={styles.button} onPress={() => downloadVideo(contentId, url)}><Text>Download Offline</Text></Pressable>
      <Pressable style={styles.secondary} onPress={() => queueOfflineAction({ type: "video_progress", contentId, percent: 100 })}><Text style={styles.text}>Mark Watched</Text></Pressable>
    </View>
  );
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 16 }, video: { width: "100%", height: 240, backgroundColor: "black" }, button: { backgroundColor: "#4ade80", padding: 14, borderRadius: 8, marginTop: 16, alignItems: "center" as const }, secondary: { padding: 14, alignItems: "center" as const }, text: { color: "#f9fafb" } };
