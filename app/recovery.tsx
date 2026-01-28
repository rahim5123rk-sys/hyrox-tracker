import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, LayoutAnimation, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FUEL_GUIDES = [
  {
    id: 'carb',
    title: "CARB LOADING PROTOCOL",
    img: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800",
    summary: "Don't eat pasta the night before. Start 48 hours out.",
    details: [
      "THE ERROR: Eating a massive heavy meal the night before. You'll wake up bloated.",
      "THE FIX: Increase carb intake by 30% starting 2 days before the race. Rice, potatoes, oats.",
      "RACE MORNING: Eat 3 hours before start time. Oatmeal or toast. Nothing heavy/greasy.",
      "TARGET: 6-8g of carbohydrates per kg of bodyweight in the 24h leading up."
    ]
  },
  {
    id: 'intra',
    title: "INTRA-RACE FUEL",
    img: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=800",
    summary: "You will deplete glycogen by the Row. You need liquid energy.",
    details: [
      "THE ERROR: Drinking only water. You need electrolytes and carbs to sustain power output.",
      "THE FIX: Taking a gel right before the Roxzone run to the Row.",
      "STRATEGY: Don't choke on a gel while breathing heavy. Practice taking gels during intervals.",
      "TARGET: 30-60g carbs per hour if your race is over 70 minutes."
    ]
  },
  {
    id: 'post',
    title: "IMMEDIATE RECOVERY",
    img: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800",
    summary: "The 30-minute anabolic window is real for Hyrox damage.",
    details: [
      "THE ERROR: Celebrating with beer immediately. Alcohol stops muscle repair.",
      "THE FIX: Protein + Fast Carbs (e.g. Whey + Banana) within 30 mins.",
      "STRATEGY: Rehydrate with electrolytes before switching to celebration mode.",
      "TARGET: 25g Protein + 50g Carbs immediately post-race."
    ]
  }
];

const RECOVERY_CHECKLIST = [
  { id: 'sleep', label: "SLEEP 7+ HOURS" },
  { id: 'protein', label: "PROTEIN (2g/kg)" },
  { id: 'water', label: "HYDRATION (3L+)" },
  { id: 'stretch', label: "15 MIN MOBILITY" },
  { id: 'creatine', label: "CREATINE (5g)" },
];

export default function Recovery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [checklist, setChecklist] = useState<string[]>([]);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    const today = new Date().toLocaleDateString();
    const saved = await AsyncStorage.getItem(`recovery_${today}`);
    if (saved) setChecklist(JSON.parse(saved));
  };

  const toggleItem = async (id: string) => {
    const today = new Date().toLocaleDateString();
    let updated = [...checklist];
    if (updated.includes(id)) {
        updated = updated.filter(i => i !== id);
    } else {
        updated.push(id);
    }
    setChecklist(updated);
    await AsyncStorage.setItem(`recovery_${today}`, JSON.stringify(updated));
  };

  const progress = checklist.length / RECOVERY_CHECKLIST.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backLink}>← BACK TO DISCOVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>FUEL & <Text style={{color: '#FFD700'}}>REPAIR</Text></Text>
        <Text style={styles.subtitle}>NUTRITION PROTOCOLS & LOG</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* RECOVERY TRACKER */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DAILY MAINTENANCE LOG</Text>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% READY</Text>
        </View>
        
        <View style={styles.trackerCard}>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            
            <View style={styles.checklist}>
                {RECOVERY_CHECKLIST.map((item) => {
                    const isDone = checklist.includes(item.id);
                    return (
                        <TouchableOpacity 
                            key={item.id} 
                            style={[styles.checkRow, isDone && styles.checkRowDone]} 
                            onPress={() => toggleItem(item.id)}
                        >
                            <Text style={[styles.checkLabel, isDone && {color: '#000', fontWeight: '900'}]}>{item.label}</Text>
                            <View style={[styles.checkbox, isDone && {backgroundColor: '#000', borderColor: '#000'}]}>
                                {isDone && <Ionicons name="checkmark" size={14} color="#FFD700" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>

        {/* FUELING GUIDES */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FUELING PROTOCOLS</Text>
        </View>

        {FUEL_GUIDES.map((item) => (
            <GuideCard key={item.id} item={item} />
        ))}

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

function GuideCard({ item }: any) {
    const [expanded, setExpanded] = useState(false);
    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity style={[styles.cardContainer, expanded && styles.cardExpanded]} activeOpacity={0.9} onPress={toggle}>
            <ImageBackground source={{ uri: item.img }} style={styles.cardImage} imageStyle={{ borderRadius: 16, opacity: 0.8 }}>
                <View style={styles.cardOverlay}>
                    <View style={{flex: 1}}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {!expanded && <Text style={styles.tapHint}>TAP TO EXPAND</Text>}
                    </View>
                    <Ionicons name={expanded ? "chevron-up-circle" : "chevron-down-circle"} size={28} color="#FFD700" />
                </View>
            </ImageBackground>
            <View style={styles.cardBody}>
                <Text style={styles.cardSummary}>{item.summary}</Text>
                {expanded && (
                    <View style={styles.detailsBox}>
                        <View style={styles.divider} />
                        {item.details.map((detail: string, i: number) => (
                            <View key={i} style={styles.detailRow}>
                                <Text style={styles.detailText}>{detail}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 15 },
  backLink: { color: '#FFD700', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  scroll: { padding: 20 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  progressText: { color: '#FFD700', fontSize: 12, fontWeight: '900' },

  // TRACKER
  trackerCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#333' },
  progressBarBg: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 20 },
  progressBarFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  checklist: { gap: 10 },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#121212', borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  checkRowDone: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  checkLabel: { color: '#ccc', fontWeight: 'bold', fontSize: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },

  // GUIDE CARDS
  cardContainer: { marginBottom: 25, borderRadius: 16, backgroundColor: '#1E1E1E', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  cardExpanded: { borderColor: '#FFD700' },
  cardImage: { width: '100%', height: 100, justifyContent: 'flex-end' },
  cardOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 15 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  tapHint: { color: '#FFD700', fontSize: 8, fontWeight: '900', marginTop: 2 },
  cardBody: { padding: 20 },
  cardSummary: { color: '#ccc', fontSize: 13, lineHeight: 20, fontWeight: '500' },
  detailsBox: { marginTop: 15 },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 15 },
  detailRow: { marginBottom: 10 },
  detailText: { color: '#eee', fontSize: 13, lineHeight: 20 },
});