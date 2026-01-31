import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' }, 
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="templates" 
          options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} 
        />
        <Stack.Screen 
          name="workout_active" 
          options={{ animation: 'fade_from_bottom', gestureEnabled: false }} 
        />
        <Stack.Screen name="race" options={{ gestureEnabled: false }} />
        <Stack.Screen 
          name="log_details" 
          options={{ presentation: 'card', animation: 'slide_from_right' }} 
        />
        {/* NEW MANUAL LOG SCREEN */}
        <Stack.Screen 
          name="manual_log_details" 
          options={{ presentation: 'modal', headerShown: false }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}