import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols'; // If using SF Symbols
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 1. LIQUID GLASS STYLE FOR THE MAIN BAR
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: 'transparent', // Crucial: Let the blur show through
          borderTopWidth: 0,
          elevation: 0,
        },
        // 2. The Native Glass Background
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="systemUltraThinMaterial" // The "Liquid" Preset
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
            title: "Home",
            tabBarIcon: ({color}) => <SymbolView name="house.fill" tintColor={color} />
        }} 
      />
      {/* ... other tabs ... */}

      {/* 3. THE NEW API (PR #41239) 
        This floats *above* the tab bar but acts as part of the chrome.
      */}
      <Tabs.BottomAccessory>
        <View style={[styles.accessoryContainer, { bottom: 90 }]}>
            {/* Example: A "Now Playing" or "Quick Action" Liquid Pill */}
            <BlurView intensity={90} tint="systemChromeMaterial" style={styles.liquidPill}>
                 <View style={styles.pillContent}>
                    {/* Your Floating Controls Go Here */}
                 </View>
            </BlurView>
        </View>
      </Tabs.BottomAccessory>

    </Tabs>
  );
}

const styles = StyleSheet.create({
  accessoryContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 60,
    // No z-index needed; NativeTabs handles layering automatically
  },
  liquidPill: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  pillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  }
});