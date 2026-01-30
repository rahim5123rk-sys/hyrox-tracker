import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORT REAL DATA
import { Region, UPCOMING_RACES } from '../data/races';

const REGIONS: (Region | 'ALL')[] = ['ALL', 'UK', 'EUROPE', 'USA', 'APAC', 'LATAM'];

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
  
  // RACE FINDER STATE
  const [isRaceFinderOpen, setRaceFinderOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');

  const handleOpenLink = (url: string) => {
    if (url !== '#') Linking.openURL(url);
  };

  // Filter Races logic
  const filteredRaces = activeRegion === 'ALL' 
    ? UPCOMING_RACES.sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime())
    : UPCOMING_RACES.filter(r => r.region === activeRegion).sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());

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

        {/* LINK 3: FIND A RACE (TRIGGERS MODAL) */}
        <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.guideCard, { borderColor: '#0A84FF' }]} 
            onPress={() => setRaceFinderOpen(true)}
        >
            <ImageBackground 
              source={{ uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1000' }} 
              style={styles.cardImage}
              imageStyle={{ borderRadius: 30, opacity: 0.6 }}
            >
              <View style={styles.overlayCenter}>
                <Text style={[styles.guideTitle, {color: '#0A84FF'}]}>FIND A RACE NEAR YOU</Text>
                <Text style={styles.guideSub}>{UPCOMING_RACES.length} UPCOMING DEPLOYMENTS</Text>
                <View style={[styles.guideBtn, {backgroundColor: '#0A84FF'}]}><Text style={styles.guideBtnText}>VIEW CALENDAR</Text></View>
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

      {/* RACE FINDER MODAL */}
      <Modal visible={isRaceFinderOpen} animationType="slide" transparent={true} onRequestClose={() => setRaceFinderOpen(false)}>
        <BlurView intensity={90} tint="dark" style={styles.modalContainer}>
            <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
                
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                    <View>
                        <Text style={styles.modalTitle}>GLOBAL DEPLOYMENTS</Text>
                        <Text style={styles.modalSub}>{filteredRaces.length} EVENTS FOUND</Text>
                    </View>
                    <TouchableOpacity onPress={() => setRaceFinderOpen(false)} style={styles.closeBtn}>
                        <Ionicons name="close-circle" size={36} color="#444" />
                    </TouchableOpacity>
                </View>

                {/* Region Filter */}
                <View style={{ height: 45, marginBottom: 15 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {REGIONS.map((region) => (
                            <TouchableOpacity 
                                key={region} 
                                style={[styles.regionChip, activeRegion === region && styles.regionChipActive]}
                                onPress={() => setActiveRegion(region)}
                            >
                                <Text style={[styles.regionText, activeRegion === region && {color: '#000'}]}>{region}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Race List */}
                <FlatList
                    data={filteredRaces}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.raceRow} 
                            onPress={() => Linking.openURL(item.url)}
                        >
                            <View style={styles.dateBadge}>
                                <Text style={styles.dateMonth}>
                                    {new Date(item.isoDate).toLocaleString('default', { month: 'short', timeZone: 'UTC' }).toUpperCase()}
                                </Text>
                                <Text style={styles.dateDay}>
                                    {item.isoDate.startsWith('2099') ? '?' : new Date(item.isoDate).getUTCDate()}
                                </Text>
                            </View>
                            <View style={{flex: 1}}>
                                <View style={{flexDirection:'row', alignItems:'center', gap: 6}}>
                                    <Text style={styles.raceCity}>{item.city}</Text>
                                    {item.type === 'MAJOR' && <Ionicons name="star" size={10} color="#FFD700" />}
                                </View>
                                <Text style={styles.raceVenue}>{item.venue}</Text>
                                <Text style={styles.raceDate}>{item.date}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#444" />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </BlurView>
      </Modal>

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
  guideTitle: { color: '#FFD700', fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1, textAlign: 'center' },
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

  // MODAL STYLES
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: '92%', backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  modalSub: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  closeBtn: { padding: 5, marginTop: -5 },
  
  // CHIPS
  regionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333', justifyContent: 'center' },
  regionChipActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  regionText: { color: '#666', fontWeight: '900', fontSize: 10 },

  // RACE ROW
  raceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222', gap: 15 },
  dateBadge: { alignItems: 'center', backgroundColor: '#1E1E1E', paddingVertical: 8, width: 50, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  dateMonth: { color: '#FFD700', fontSize: 9, fontWeight: '900' },
  dateDay: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  raceCity: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  raceVenue: { color: '#888', fontSize: 11, fontWeight: '500' },
  raceDate: { color: '#555', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});