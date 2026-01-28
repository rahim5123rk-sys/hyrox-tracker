import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, LayoutAnimation, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';

// Enable smooth expansion animations on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- CONTENT DATABASE ---
const GUIDE_DATA = [
  {
    id: 'run',
    title: "THE RUNNING TRAP",
    img: "https://images.unsplash.com/photo-1530143311094-34d807799e8f?q=80&w=800",
    summary: "Don't sprint the first 1km. Hyrox is an endurance race, not a track meet. Save your energy.",
    details: [
      "THE MISTAKE: Running too fast at the start because of excitement. This will make you crash later.",
      "THE FIX: Start slow. Use the first 1km to warm up your body.",
      "STRATEGY: Use the run to recover. If you run too hard, you won't have energy for the heavy stations.",
      "TARGET: Run at a steady pace where you can still breathe comfortably."
    ]
  },
  {
    id: 'sled',
    title: "SLED PUSH SECRETS",
    img: "https://images.unsplash.com/photo-1517963879466-e025aecc96e1?q=80&w=800",
    summary: "Keep your body low. If you stand up, it gets harder. Keep moving, even if it's slow.",
    details: [
      "THE MISTAKE: Pushing with straight arms. This tires out your shoulders quickly.",
      "THE FIX: Keep your elbows bent and close to your body. Lean your shoulders into the sled handles.",
      "STRATEGY: Don't stop moving. It is much harder to start a stopped sled than to keep a moving one going.",
      "TARGET: Take short, fast steps. Drive hard with your legs."
    ]
  },
  {
    id: 'burpee',
    title: "BURPEE EFFICIENCY",
    img: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800",
    summary: "Step back, step up. Don't jump excessively. Save your legs for the Wall Balls.",
    details: [
      "THE MISTAKE: Doing a full explosive push-up. This wastes too much energy.",
      "THE FIX: Step back one foot at a time. Drop to your knees, then chest. Step up one foot at a time.",
      "STRATEGY: Focus on jumping forward as far as you can. Fewer jumps means you finish faster.",
      "TARGET: Find a steady rhythm. Ignore the person next to you and focus on your own pace."
    ]
  },
  {
    id: 'wallball',
    title: "WALL BALL RHYTHM",
    img: "https://images.unsplash.com/photo-1599058917232-d750c8259796?q=80&w=800",
    summary: "Don't let your arms drop. Use your legs to throw the ball. Break it into small sets.",
    details: [
      "THE MISTAKE: Trying to do too many at once and getting tired. Also, not squatting low enough.",
      "THE FIX: Do small sets (like 15 or 25 reps) with very short breaks in between.",
      "STRATEGY: Keep your hands up. Lowering them wastes energy.",
      "TARGET: Squat deep every time. If you don't go low enough, the rep doesn't count."
    ]
  },
  {
    id: 'rox',
    title: "ROXZONE DISCIPLINE",
    img: "https://images.unsplash.com/photo-1552674605-46f538379c4e?q=80&w=800",
    summary: "Never walk in the transition area (Roxzone). This is where you can beat faster athletes.",
    details: [
      "THE MISTAKE: Walking slowly in the transition area or stopping for too long.",
      "THE FIX: Keep jogging, even if it's slow. Drink water while you move.",
      "STRATEGY: Know where to go. Look at the stadium map so you don't get lost.",
      "TARGET: Stay calm entering the station. Run out of the station."
    ]
  }
];

export default function Guide() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backLink}>← BACK TO DISCOVER</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ENGINEER <Text style={{color: '#FFD700'}}>MANUAL</Text></Text>
        <Text style={styles.subtitle}>TAP CARDS TO REVEAL TACTICS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {GUIDE_DATA.map((item) => (
            <GuideCard key={item.id} item={item} />
        ))}
        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
}

function GuideCard({ item }: any) {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity 
            style={[styles.cardContainer, expanded && styles.cardExpanded]} 
            activeOpacity={0.9} 
            onPress={toggleExpand}
        >
            <ImageBackground source={{ uri: item.img }} style={styles.cardImage} imageStyle={{ borderRadius: 16, opacity: 0.8 }}>
                <View style={styles.cardOverlay}>
                    <View style={{flex: 1, paddingRight: 10}}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {!expanded && <Text style={styles.tapHint}>TAP TO READ</Text>}
                    </View>
                    <Ionicons 
                        name={expanded ? "chevron-up-circle" : "chevron-down-circle"} 
                        size={28} 
                        color="#FFD700" 
                    />
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
                        <TouchableOpacity onPress={toggleExpand} style={styles.collapseBtn}>
                            <Text style={styles.collapseText}>CLOSE MANUAL</Text>
                        </TouchableOpacity>
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
  
  cardContainer: { marginBottom: 25, borderRadius: 16, backgroundColor: '#1E1E1E', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  cardExpanded: { borderColor: '#FFD700' },
  
  cardImage: { width: '100%', height: 120, justifyContent: 'flex-end' },
  cardOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 15 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  tapHint: { color: '#FFD700', fontSize: 8, fontWeight: '900', marginTop: 2 },

  cardBody: { padding: 20 },
  cardSummary: { color: '#ccc', fontSize: 14, lineHeight: 22, fontWeight: '500' },
  
  detailsBox: { marginTop: 15 },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 15 },
  detailRow: { marginBottom: 12 },
  detailText: { color: '#eee', fontSize: 13, lineHeight: 20 },
  
  collapseBtn: { marginTop: 10, alignItems: 'center', padding: 10 },
  collapseText: { color: '#666', fontSize: 10, fontWeight: '900' }
});