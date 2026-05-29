import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { api } from "./api";

const QUEUE_KEY = "guru_offline_queue";
const CACHE_KEY = "guru_cached_topics";

export async function queueOfflineAction(action: unknown) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ action, createdAt: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function syncWhenOnline() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  const remaining = [];
  for (const item of queue) {
    try {
      await api("/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          userId: "mobile-user",
          eventName: "mobile_offline_sync",
          feature: "mobile_offline",
          metadata: item
        })
      });
    } catch {
      remaining.push(item);
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export async function cacheLastThreeTopics(topics: unknown[]) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(topics.slice(0, 3)));
}

export async function getCachedTopics() {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function downloadVideo(contentId: string, url: string) {
  const target = `${FileSystem.documentDirectory}${contentId}.mp4`;
  const download = FileSystem.createDownloadResumable(url, target);
  const result = await download.downloadAsync();
  return result?.uri || target;
}
