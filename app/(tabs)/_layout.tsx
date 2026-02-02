import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          height: 95,
          paddingBottom: 35,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }
      }}
    >
      {/* 1. DISCOVER (Left) */}
      <Tabs.Screen
        name="discover"
        options={{
          title: 'DISCOVER',
          tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
        }}
      />

      {/* 2. ENGINE (Middle) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'ENGINE',
          tabBarIcon: ({ color }) => <Ionicons name="speedometer" size={24} color={color} />,
        }}
      />
      
      {/* 3. HISTORY (Right) */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'HISTORY',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
        }}
      />
      
      {/* HIDDEN TABS (Keep these at the bottom so they don't mess up order) */}
      <Tabs.Screen
        name="guide"
        options={{
          href: null,
          title: 'GUIDE',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}