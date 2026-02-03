import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES } from '../utils/pacing';
import { DataStore } from './services/DataStore'; // IMPORTS FIXED

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { colors, setMode, mode, isDark } = useTheme(); 
  
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
                  // UPDATED: Use DataStore to clear everything including analytics
                  await DataStore.clearAll();
                  router.replace('/onboarding');
              }}
          ]
      );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: colors.background, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{padding: 5}}>
            <Ionicons name="chevron-down" size={30} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>SYSTEM <Text style={{color: colors.primary}}>SETTINGS</Text></Text>
        <View style={{width: 35}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* 1. APPEARANCE */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>APPEARANCE</Text>
            <View style={styles.grid}>
                {['light', 'dark', 'system'].map((m) => (
                    <TouchableOpacity 
                        key={m} 
                        style={[
                            styles.catBtn, 
                            { backgroundColor: colors.background, borderColor: colors.border },
                            mode === m && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setMode(m as any)}
                    >
                        <Text style={[styles.catText, { color: mode === m ? '#000' : colors.subtext }]}>{m.toUpperCase()}</Text>
                        {mode === m && <Ionicons name="checkmark-circle" size={16} color="#000" style={{marginTop: 4}} />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* 2. IDENTITY */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>IDENTITY</Text>
            <View style={styles.inputRow}>
                <Text style={[styles.label, { color: colors.text }]}>CODENAME</Text>
                <TextInput 
                    style={[styles.input, { color: colors.primary }]} 
                    value={name} 
                    onChangeText={setName} 
                    placeholder="ATHLETE" 
                    placeholderTextColor={colors.subtext}
                />
            </View>
        </View>

        {/* 3. DEFAULT DIVISION */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 15}}>
                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>DEFAULT DIVISION</Text>
                <Ionicons name="body-outline" size={16} color={colors.primary} />
            </View>
            
            <View style={styles.grid}>
                {Object.keys(CATEGORIES).map((cat) => (
                    <TouchableOpacity 
                        key={cat} 
                        style={[
                            styles.catBtn, 
                            { backgroundColor: colors.background, borderColor: colors.border },
                            category === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text style={[styles.catText, { color: category === cat ? '#000' : colors.subtext }]}>
                            {CATEGORIES[cat as keyof typeof CATEGORIES].label}
                        </Text>
                        {category === cat && <Ionicons name="checkmark-circle" size={16} color="#000" style={{marginTop: 4}} />}
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* 4. HARDWARE LINKS */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>CONNECTED HARDWARE & APPS</Text>
            
            <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={() => router.push('/devices')}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={styles.iconBox}><Ionicons name="bluetooth" size={18} color="#007AFF" /></View>
                    <Text style={[styles.linkLabel, { color: colors.text }]}>Heart Rate Monitors</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.linkRow, { borderBottomWidth: 0 }]} onPress={() => router.push('/integrations')}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(255, 45, 85, 0.15)'}]}><Ionicons name="heart" size={18} color="#FF2D55" /></View>
                    <Text style={[styles.linkLabel, { color: colors.text }]}>Health & Integrations</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
            </TouchableOpacity>
        </View>

        {/* 5. INTERFACE */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>INTERFACE</Text>
            <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>HAPTIC FEEDBACK</Text>
                <Switch 
                    value={haptics} 
                    onValueChange={setHaptics} 
                    trackColor={{false: colors.border, true: colors.primary}} 
                    thumbColor={haptics ? '#000' : '#f4f3f4'}
                />
            </View>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>PUSH NOTIFICATIONS</Text>
                <Switch 
                    value={notifications} 
                    onValueChange={setNotifications} 
                    trackColor={{false: colors.border, true: colors.primary}} 
                    thumbColor={notifications ? '#000' : '#f4f3f4'}
                />
            </View>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveSettings}>
            <Text style={styles.saveText}>SAVE CONFIGURATION</Text>
        </TouchableOpacity>

        {/* DEBUG CONSOLE LINK */}
        <TouchableOpacity 
            style={{ marginVertical: 30, alignItems: 'center' }} 
            onPress={() => router.push('/debug')}
        >
            <Text style={{ color: colors.subtext, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>
                OPEN DEVELOPER CONSOLE
            </Text>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 25, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  scroll: { padding: 20 },
  section: { marginBottom: 30, padding: 20, borderRadius: 20, borderWidth: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: 'bold' },
  input: { fontSize: 18, fontWeight: '900', textAlign: 'right', minWidth: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catBtn: { width: '30%', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  catText: { fontSize: 10, fontWeight: '900' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0, 122, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  linkLabel: { fontSize: 14, fontWeight: 'bold' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  switchLabel: { fontSize: 12, fontWeight: 'bold' },
  saveBtn: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  saveText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  resetBtn: { padding: 15, alignItems: 'center' },
  resetText: { color: '#FF453A', fontSize: 10, fontWeight: '900' },
});