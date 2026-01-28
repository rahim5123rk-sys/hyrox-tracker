import { useRouter } from 'expo-router';
import { ImageBackground, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DISCOVER_ITEMS = [
  {
    id: 1,
    title: 'THE 2026 WORLD CHAMPS',
    tag: 'GLOBAL NEWS',
    desc: 'Stockholm prepares for the biggest deployment in history. Elite spots closing.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000',
    url: 'https://hyrox.com/find-my-race/',
    isActionable: true
  },
  {
    id: 2,
    title: 'MASTER THE SLED PUSH',
    tag: 'PRO TIPS',
    desc: 'Why your foot placement is killing your Roxzone time.',
    image: 'https://images.unsplash.com/photo-1599058917232-d750c8259796?q=80&w=1000',
    url: 'https://hyrox.com/the-workout/',
    isActionable: false
  },
];

export default function Discover() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenLink = (url: string) => {
    if (url !== '#') Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>DISCOVER</Text>
        <Text style={styles.subtitle}>HYROX INTELLIGENCE FEED</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* LINK 1: GUIDE */}
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.guideCard}
            onPress={() => router.push('/(tabs)/guide')}
        >
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=1000' }} 
              style={styles.cardImage}
              imageStyle={{ borderRadius: 30, opacity: 0.6 }}
            >
              <View style={styles.overlayCenter}>
                <Text style={styles.guideTitle}>TACTICAL FIELD MANUAL</Text>
                <Text style={styles.guideSub}>ACCESS ELITE STRATEGY & TIPS</Text>
                <View style={styles.guideBtn}><Text style={styles.guideBtnText}>OPEN MANUAL</Text></View>
              </View>
            </ImageBackground>
        </TouchableOpacity>

        {/* LINK 2: NUTRITION & RECOVERY */}
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.guideCard, { borderColor: '#32D74B' }]} 
            onPress={() => router.push('/recovery')}
        >
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000' }} 
              style={styles.cardImage}
              imageStyle={{ borderRadius: 30, opacity: 0.6 }}
            >
              <View style={styles.overlayCenter}>
                <Text style={[styles.guideTitle, {color: '#32D74B'}]}>FUEL & REPAIR</Text>
                <Text style={styles.guideSub}>NUTRITION & RECOVERY TRACKING</Text>
                <View style={[styles.guideBtn, {backgroundColor: '#32D74B'}]}><Text style={styles.guideBtnText}>OPEN LOG</Text></View>
              </View>
            </ImageBackground>
        </TouchableOpacity>

        {/* LINK 3: GLOBAL RACE CALENDAR (NEW) */}
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.guideCard, { borderColor: '#0A84FF' }]} 
            onPress={() => router.push('/race_calendar')}
        >
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1000' }} 
              style={styles.cardImage}
              imageStyle={{ borderRadius: 30, opacity: 0.6 }}
            >
              <View style={styles.overlayCenter}>
                <Text style={[styles.guideTitle, {color: '#0A84FF'}]}>GLOBAL CALENDAR</Text>
                <Text style={styles.guideSub}>FIND RACES BY REGION</Text>
                <View style={[styles.guideBtn, {backgroundColor: '#0A84FF'}]}><Text style={styles.guideBtnText}>VIEW EVENTS</Text></View>
              </View>
            </ImageBackground>
        </TouchableOpacity>

        {DISCOVER_ITEMS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            activeOpacity={0.9} 
            style={styles.card}
            onPress={() => handleOpenLink(item.url)}
          >
            <ImageBackground 
              source={{ uri: item.image }} 
              style={styles.cardImage}
              imageStyle={{ borderRadius: 30 }}
            >
              <View style={styles.overlay}>
                <View style={styles.topRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                </View>

                <View style={styles.bottomContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                  
                  {item.isActionable && (
                    <View style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>SECURE ENTRY</Text>
                    </View>
                  )}
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 25, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 34, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
  scroll: { padding: 20 },
  
  // SPECIAL CARDS
  guideCard: { height: 180, marginBottom: 20, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#FFD700' },
  overlayCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  guideTitle: { color: '#FFD700', fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  guideSub: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 15 },
  guideBtn: { backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  guideBtnText: { color: '#000', fontWeight: '900', fontSize: 10 },

  // STANDARD CARDS
  card: { height: 380, marginBottom: 25, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  cardImage: { flex: 1 },
  overlay: { flex: 1, padding: 25, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  tagBadge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tagText: { color: '#000', fontSize: 10, fontWeight: '900' },
  bottomContent: { gap: 8 },
  cardTitle: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic' },
  cardDesc: { color: '#bbb', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  actionBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 15, alignItems: 'center', width: '100%' },
  actionBtnText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
});