import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Configure Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

function StackWithTheme() {
  const { isDark, colors } = useTheme();
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
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
        <Stack.Screen 
          name="manual_log_details" 
          options={{ presentation: 'modal', headerShown: false }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StackWithTheme />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}