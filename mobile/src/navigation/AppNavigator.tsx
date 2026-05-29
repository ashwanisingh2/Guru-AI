import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AIChatScreen } from "../screens/AIChatScreen";
import { CodeEditorScreen } from "../screens/CodeEditorScreen";
import { HomeDashboardScreen } from "../screens/HomeDashboardScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { ProfileSettingsScreen } from "../screens/ProfileSettingsScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { TopicListScreen } from "../screens/TopicListScreen";
import { VideoPlayerScreen } from "../screens/VideoPlayerScreen";

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  Video: { contentId: string; url: string };
  Code: { problemId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerStyle: { backgroundColor: "#111827" }, headerTintColor: "#f9fafb", tabBarStyle: { backgroundColor: "#111827" } }}>
      <Tabs.Screen name="Home" component={HomeDashboardScreen} />
      <Tabs.Screen name="Topics" component={TopicListScreen} />
      <Tabs.Screen name="Chat" component={AIChatScreen} />
      <Tabs.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tabs.Screen name="Notifications" component={NotificationsScreen} />
      <Tabs.Screen name="Profile" component={ProfileSettingsScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Video" component={VideoPlayerScreen} />
      <Stack.Screen name="Code" component={CodeEditorScreen} />
    </Stack.Navigator>
  );
}
