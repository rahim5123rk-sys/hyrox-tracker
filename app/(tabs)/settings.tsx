import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../../utils/pacing';

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('MEN_OPEN'); 
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const profile = await AsyncStorage.getItem('user_profile');
      if (profile) {
          const p = JSON.parse(profile);
          if (p.name) setName(p.name);
      }
      
      const savedCat = await AsyncStorage.getItem('userCategory');
      if (savedCat) setCategory(savedCat);

    } catch (e) {
      console.log('Failed to load settings');
    }
  };

  const saveSettings = async () => {
    try {
      const existing = await AsyncStorage.getItem('user_profile');
      const profile = existing ? JSON.parse(existing) : {};
      profile.name = name;
      
      await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
      await AsyncStorage.setItem('userCategory', category);
      
      Alert.alert('Success', 'Configuration updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save settings.');
    }
  };

  const handleReset = () => {
      Alert.alert(
          "Factory Reset",
          "This will delete all race history, personal bests, and settings. Are you sure?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete Everything", style: "destructive", onPress: async () => {
                  await AsyncStorage.clear();
                  router.replace('/onboarding');
              }}
          ]
      );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>SYSTEM <Text style={{color: '#FFD700'}}>SETTINGS</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* 1. IDENTITY */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>IDENTITY</Text>
            <View style={styles.inputRow}>
                <Text style={styles.label}>CODENAME</Text>
                <TextInput 
                    style={styles.input} 
                    value={name} 
                    onChangeText={setName} 
                    placeholder="ATHLETE" 
                    placeholderTextColor="#555"
                />
            </View>
        </View>

        {/* 2. DEFAULT DIVISION (NEW FEATURE) */}
        <View style={styles.section}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 15}}>
                <Text style={styles.sectionTitle}>DEFAULT DIVISION</Text>
                <Ionicons name="body-outline" size={16} color="#FFD700" />
            </View>
            
            <View style={styles.grid}>
                {Object.keys(CATEGORIES).map((cat) => (
                    <TouchableOpacity 
                        key={cat} 
                        style={[styles.catBtn, category === cat && styles.catBtnActive]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text style={[styles.catText, category === cat && {color: '#000'}]}>
                            {CATEGORIES[cat as keyof typeof CATEGORIES].label}
                        </Text>
                        {category === cat && <Ionicons name="checkmark-circle" size={16} color="#000" style={{marginTop: 4}} />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* 3. HEALTH & WEARABLES (RESTORED LINKS) */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>CONNECTED HARDWARE & APPS</Text>
            
            {/* Link to Devices (HRM/Bluetooth) */}
            <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/devices')}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={styles.iconBox}><Ionicons name="bluetooth" size={18} color="#007AFF" /></View>
                    <Text style={styles.linkLabel}>Heart Rate Monitors</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#444" />
            </TouchableOpacity>

            {/* Link to Integrations (Strava/Apple Health) */}
            <TouchableOpacity style={[styles.linkRow, {borderBottomWidth: 0}]} onPress={() => router.push('/integrations')}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(255, 45, 85, 0.15)'}]}><Ionicons name="heart" size={18} color="#FF2D55" /></View>
                    <Text style={styles.linkLabel}>Health & Integrations</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#444" />
            </TouchableOpacity>
        </View>

        {/* 4. INTERFACE PREFERENCES */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>INTERFACE</Text>
            
            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>HAPTIC FEEDBACK</Text>
                <Switch 
                    value={haptics} 
                    onValueChange={setHaptics} 
                    trackColor={{false: '#333', true: '#FFD700'}} 
                    thumbColor={haptics ? '#000' : '#f4f3f4'}
                />
            </View>
            <View style={[styles.switchRow, {borderBottomWidth: 0}]}>
                <Text style={styles.switchLabel}>PUSH NOTIFICATIONS</Text>
                <Switch 
                    value={notifications} 
                    onValueChange={setNotifications} 
                    trackColor={{false: '#333', true: '#FFD700'}} 
                    thumbColor={notifications ? '#000' : '#f4f3f4'}
                />
            </View>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveSettings}>
            <Text style={styles.saveText}>SAVE CONFIGURATION</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>FACTORY RESET APP</Text>
        </TouchableOpacity>

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 25, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  scroll: { padding: 20 },
  
  section: { marginBottom: 30, backgroundColor: '#121212', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  sectionTitle: { color: '#666', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  input: { color: '#FFD700', fontSize: 18, fontWeight: '900', textAlign: 'right', minWidth: 100 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catBtn: { width: '48%', backgroundColor: '#1A1A1A', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  catBtnActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  catText: { color: '#888', fontSize: 11, fontWeight: '900' },

  // LINK ROWS (NEW)
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 122, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  linkLabel: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  switchLabel: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },

  saveBtn: { backgroundColor: '#FFD700', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  saveText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  
  resetBtn: { padding: 15, alignItems: 'center' },
  resetText: { color: '#FF453A', fontSize: 10, fontWeight: '900' },
});