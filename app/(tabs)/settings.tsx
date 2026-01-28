import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- YOUR ORIGINAL CATEGORY DATA ---
const CATEGORIES = [
  { id: 'MEN_OPEN', label: "MEN'S OPEN" },
  { id: 'MEN_PRO', label: "MEN'S PRO" },
  { id: 'WOMEN_OPEN', label: "WOMEN'S OPEN" },
  { id: 'WOMEN_PRO', label: "WOMEN'S PRO" },
];

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State from your original code
  const [selectedCategory, setSelectedCategory] = useState('MEN_OPEN');
  
  // New State for toggles
  const [voiceCoach, setVoiceCoach] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('userCategory');
      if (saved) setSelectedCategory(saved);
    } catch (e) {
      console.log('Failed to load settings');
    }
  };

  const saveCategory = async (id: string) => {
    try {
      await AsyncStorage.setItem('userCategory', id);
      setSelectedCategory(id);
      // Haptic feedback or subtle alert
      Alert.alert("UPDATED", "Race weights adjusted for " + id.replace('_', ' '));
    } catch (e) {
      console.log('Failed to save');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "FACTORY RESET",
      "This will wipe all race logs and settings. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "WIPE DATA", 
          style: 'destructive', 
          onPress: async () => {
            await AsyncStorage.clear();
            Updates.reloadAsync();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>SETTINGS</Text>
        <Text style={styles.subtitle}>SYSTEM CONFIGURATION</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: RACE CATEGORY (RESTORED) --- */}
        <Text style={styles.sectionTitle}>RACE CATEGORY</Text>
        <View style={styles.section}>
            <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.option, selectedCategory === cat.id && styles.active]}
                        onPress={() => saveCategory(cat.id)}
                    >
                        <Text style={[styles.optionText, selectedCategory === cat.id && styles.activeText]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* --- SECTION 2: CONNECTIONS (NEW) --- */}
        <Text style={styles.sectionTitle}>INTEGRATIONS</Text>
        <View style={styles.section}>
            <TouchableOpacity style={styles.row} onPress={() => router.push('/integrations')}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#FF453A' }]}>
                        <Ionicons name="heart" size={18} color="#fff" />
                    </View>
                    <Text style={styles.rowLabel}>Health & Wearables</Text>
                </View>
                <View style={styles.rowRight}>
                    <Text style={styles.rowStatus}>Apple / Garmin</Text>
                    <Ionicons name="chevron-forward" size={18} color="#666" />
                </View>
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={() => router.push('/devices')}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#0A84FF' }]}>
                        <Ionicons name="bluetooth" size={18} color="#fff" />
                    </View>
                    <Text style={styles.rowLabel}>Device Radar</Text>
                </View>
                <View style={styles.rowRight}>
                    <Text style={styles.rowStatus}>Polar / Whoop</Text>
                    <Ionicons name="chevron-forward" size={18} color="#666" />
                </View>
            </TouchableOpacity>
        </View>

        {/* --- SECTION 3: PREFERENCES (MERGED) --- */}
        <Text style={styles.sectionTitle}>APP PREFERENCES</Text>
        <View style={styles.section}>
            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#FFD700' }]}>
                        <Ionicons name="mic" size={18} color="#000" />
                    </View>
                    <Text style={styles.rowLabel}>Voice Coach</Text>
                </View>
                <Switch 
                    value={voiceCoach} 
                    onValueChange={setVoiceCoach}
                    trackColor={{ false: '#333', true: '#FFD700' }} 
                    thumbColor={voiceCoach ? '#fff' : '#888'}
                />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#333' }]}>
                        <Ionicons name="moon" size={18} color="#fff" />
                    </View>
                    <Text style={styles.rowLabel}>Dark Mode</Text>
                </View>
                <Switch 
                    value={darkMode} 
                    onValueChange={setDarkMode}
                    trackColor={{ false: '#333', true: '#FFD700' }} 
                    thumbColor={darkMode ? '#fff' : '#888'}
                />
            </View>
        </View>

        {/* --- SECTION 4: DANGER ZONE --- */}
        <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
        <View style={styles.section}>
            <TouchableOpacity style={styles.row} onPress={handleClearData}>
                <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#333' }]}>
                        <Ionicons name="trash" size={18} color="#FF453A" />
                    </View>
                    <Text style={[styles.rowLabel, { color: '#FF453A' }]}>Factory Reset App</Text>
                </View>
            </TouchableOpacity>
        </View>

        <View style={styles.footer}>
            <Text style={styles.footerText}>HYROX ENGINEER v2.2</Text>
        </View>
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 20, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 34, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
  
  scroll: { padding: 20 },

  sectionTitle: { color: '#666', fontSize: 11, fontWeight: '900', marginBottom: 10, marginLeft: 10, letterSpacing: 1 },
  section: { backgroundColor: '#1E1E1E', borderRadius: 16, overflow: 'hidden', marginBottom: 25, borderWidth: 1, borderColor: '#222' },
  
  // Grid for Categories
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 15 },
  option: { width: '48%', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#121212' },
  active: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  optionText: { color: '#888', fontWeight: 'bold', fontSize: 11 },
  activeText: { color: '#000' },

  // Standard Rows
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowStatus: { color: '#666', fontSize: 12 },
  
  divider: { height: 1, backgroundColor: '#2A2A2A', marginLeft: 58 },

  footer: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#333', fontSize: 10, fontWeight: 'bold' }
});