import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#000' : '#fff',
          borderTopColor: isDark ? '#222' : '#eee',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#FFD700', // Gold
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontWeight: '900',
          fontSize: 10,
          letterSpacing: 0.5,
          marginBottom: 5
        }
      }}
    >
      {/* 1. ENGINE (Far Left - Flash Icon) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'ENGINE',
          tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} />,
        }}
      />

      {/* 2. INTEL (Second from Left - Compass Icon) */}
      <Tabs.Screen
        name="discover"
        options={{
          title: 'INTEL',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
        }}
      />

      {/* 3. LOGBOOK (History - Time Icon) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'LOGBOOK',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} />,
        }}
      />

      {/* 4. PROFILE (Far Right - Person Icon) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />

      {/* --- HIDDEN SUB-PAGES --- */}
      <Tabs.Screen name="guide" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} /> 
      <Tabs.Screen name="templates" options={{ href: null }} />
      
      {/* Hide old file names to prevent duplicates if they still exist */}
      <Tabs.Screen name="career" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />

    </Tabs>
  );
}