import { useEffect } from "react";
import { Text, View } from "react-native";

export function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace("Login"), 900);
    return () => clearTimeout(timer);
  }, [navigation]);

  return <View style={styles.center}><Text style={styles.logo}>GURU</Text></View>;
}

const styles = { center: { flex: 1, backgroundColor: "#0a0c14", alignItems: "center" as const, justifyContent: "center" as const }, logo: { color: "#4ade80", fontSize: 42, fontWeight: "800" as const } };
