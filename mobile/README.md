# GURU React Native App

## Structure

- `src/navigation`: stack + tab navigation
- `src/screens`: splash, login, dashboard, topics, video, code, chat, profile, leaderboard, notifications
- `src/services`: API, offline sync, push notifications
- `src/components`: shared UI
- `src/store`: future state management

## Offline

- Videos downloaded with `expo-file-system`
- Progress/actions queued in AsyncStorage
- `syncWhenOnline()` flushes queue
- Last 3 topics cached locally
- Coding submissions queued when offline

## Mobile

- Firebase/Expo push notifications
- Biometric login via `expo-local-authentication`
- Dark mode theme
- Low-data mode placeholder in settings
- Picture-in-picture depends on native video platform support
