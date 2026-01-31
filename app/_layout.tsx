import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Configure notification behavior for 2026 standards
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
        {/* Main Navigation Group */}
        <Stack.Screen name="(tabs)" />

        {/* Training Lab Screens */}
        <Stack.Screen 
          name="templates" 
          options={{ 
            presentation: 'modal', 
            animation: 'slide_from_bottom',
            gestureEnabled: true 
          }} 
        />
        

      
        <Stack.Screen 
          name="workout_active" 
          options={{ 
            animation: 'fade_from_bottom', 
            gestureEnabled: false 
          }} 
        />

        {/* Race Day Screens */}
        <Stack.Screen name="race" options={{ gestureEnabled: false }} />
        
        <Stack.Screen 
          name="log_details" 
          options={{ 
            presentation: 'card', 
            animation: 'slide_from_right' 
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}