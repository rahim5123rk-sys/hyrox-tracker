import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { id: 'MEN_OPEN', label: "MEN'S OPEN" },
  { id: 'MEN_PRO', label: "MEN'S PRO" },
  { id: 'WOMEN_OPEN', label: "WOMEN'S OPEN" },
  { id: 'WOMEN_PRO', label: "WOMEN'S PRO" },
];

export default function Settings() {
  const [selectedCategory, setSelectedCategory] = useState('MEN_OPEN');

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
      Alert.alert("Success", "Race weights have been updated.");
    } catch (e) {
      console.log('Failed to save');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>SETTINGS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>SELECT RACE CATEGORY</Text>
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

      <View style={styles.section}>
        <Text style={styles.label}>APP PREFERENCES</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Voice Coach</Text>
          <Text style={{color: '#FFD700', fontWeight: 'bold'}}>ON</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Dark Mode</Text>
          <Text style={{color: '#FFD700', fontWeight: 'bold'}}>ON</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>HYROX ENGINEER v2.1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  label: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: { width: '48%', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333', alignItems: 'center', backgroundColor: '#1E1E1E' },
  
  // ACTIVE STATE: GOLD BACKGROUND, BLACK TEXT
  active: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  optionText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  activeText: { color: '#000' },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15 },
  settingText: { color: '#fff', fontSize: 16 },
  footer: { padding: 40, alignItems: 'center' },
  footerText: { color: '#333', fontWeight: 'bold' },
});