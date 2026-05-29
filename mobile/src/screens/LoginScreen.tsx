import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Pressable, Text, TextInput, View } from "react-native";

export function LoginScreen({ navigation }: any) {
  async function login() {
    await SecureStore.setItemAsync("token", "demo-token");
    navigation.replace("Main");
  }

  async function biometric() {
    const ok = await LocalAuthentication.authenticateAsync({ promptMessage: "Login to GURU" });
    if (ok.success) navigation.replace("Main");
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" placeholderTextColor="#6b7280" style={styles.input} />
      <TextInput placeholder="Password" placeholderTextColor="#6b7280" secureTextEntry style={styles.input} />
      <Pressable onPress={login} style={styles.button}><Text>Login / Register</Text></Pressable>
      <Pressable onPress={biometric} style={styles.secondary}><Text style={styles.text}>Use Biometric</Text></Pressable>
    </View>
  );
}

const styles = { page: { flex: 1, backgroundColor: "#0a0c14", padding: 20, justifyContent: "center" as const }, title: { color: "#f9fafb", fontSize: 28, marginBottom: 20 }, input: { backgroundColor: "#111827", borderColor: "#1f2937", borderWidth: 1, color: "#f9fafb", padding: 14, marginBottom: 12, borderRadius: 8 }, button: { backgroundColor: "#4ade80", padding: 14, borderRadius: 8, alignItems: "center" as const }, secondary: { padding: 14, alignItems: "center" as const }, text: { color: "#f9fafb" } };
