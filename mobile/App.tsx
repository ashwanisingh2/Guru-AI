import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { AppNavigator } from "./src/navigation/AppNavigator";

const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0a0c14",
    card: "#111827",
    text: "#f9fafb",
    border: "#1f2937",
    primary: "#4ade80"
  }
};

export default function App() {
  return (
    <NavigationContainer theme={darkTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}
