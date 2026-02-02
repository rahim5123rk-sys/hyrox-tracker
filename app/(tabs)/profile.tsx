import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, ImageBackground, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateLevel } from '../../utils/gamification';

const SCREEN_WIDTH = Dimensions.get('window').width;

// BENCHMARK VISUALS
const DIVISION_COLORS: any = {
    'PRO': '#FFD700',
    'OPEN': '#32D74B',
    'DOUBLES': '#0A84FF',
    'RELAY': '#FF9F0A',
    'UNRANKED': '#666'
};

export default function Career() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('OPERATOR');
  const [stats, setStats] = useState({ xp: 0, ops: 0 });
  const [rankData, setRankData] = useState<any>(null);
  
  // BENCHMARK STATE
  const [pftData, setPftData] = useState<any>(null);
  const [runData, setRunData] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
      // 1. Profile & Stats
      const profile = await AsyncStorage.getItem('user_profile');
      if (profile) setName(JSON.parse(profile).name.toUpperCase());

      const historyJson = await AsyncStorage.getItem('raceHistory');
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      // Calculate basic stats
      const ops = history.length;
      const xp = history.length * 150; // Simplified XP
      setStats({ xp, ops });
      setRankData(calculateLevel(xp));

      // 2. Find Benchmarks
      const pft = history.find((h: any) => h.title.includes('PFT'));
      if (pft) analyzePFT(pft.totalTime);

      const run = history.find((h: any) => h.title.includes('5K'));
      if (run) setRunData(run);
  };

  const analyzePFT = (timeStr: string) => {
      // Simple parse for demo
      const parts = timeStr.split(':').map(Number);
      const mins = parts[0] + (parts[1] / 60);
      
      let div = "RELAY";
      if (mins <= 25) div = "PRO";
      else if (mins <= 35) div = "OPEN";
      else if (mins <= 40) div = "DOUBLES";

      setPftData({ time: timeStr, division: div, date: new Date().toLocaleDateString() });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HERO HEADER */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=1000' }} 
        style={[styles.headerBg, { paddingTop: insets.top + 20 }]}
        imageStyle={{ opacity: 0.4 }}
      >
          <View style={styles.headerContent}>
              <View>
                  <Text style={styles.rankLabel}>{rankData?.currentRank.title || "ROOKIE"}</Text>
                  <Text style={styles.nameLabel}>{name}</Text>
              </View>
              <View style={styles.levelBadge}>
                  <Text style={styles.levelNum}>{rankData?.currentRank.id || 1}</Text>
                  <Text style={styles.levelText}>LVL</Text>
              </View>
          </View>
          
          {/* XP BAR */}
          <View style={styles.xpBarContainer}>
              <View style={[styles.xpBarFill, { width: `${(rankData?.progress || 0) * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>{stats.xp} XP / {rankData?.xpNeeded} TO PROMOTION</Text>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* 1. SERVICE RECORD (BENCHMARKS) */}
          <View style={styles.sectionHeader}>
              <Ionicons name="ribbon" size={18} color="#FFD700" />
              <Text style={styles.sectionTitle}>SERVICE RECORD</Text>
          </View>

          {/* PFT CARD */}
          <TouchableOpacity 
            style={[styles.certCard, pftData ? { borderColor: DIVISION_COLORS[pftData.division] } : { borderColor: '#333' }]}
            onPress={() => pftData ? setShowCertificate(true) : null}
            activeOpacity={0.9}
          >
              <View style={styles.certIcon}>
                  <Ionicons name="fitness" size={24} color={pftData ? "#000" : "#666"} />
              </View>
              <View style={{flex: 1}}>
                  <Text style={styles.certTitle}>HYROX PFT</Text>
                  <Text style={styles.certSub}>
                      {pftData ? `COMPLETED IN ${pftData.time}` : "NOT YET ATTEMPTED"}
                  </Text>
              </View>
              {pftData ? (
                  <View style={[styles.divBadge, { backgroundColor: DIVISION_COLORS[pftData.division] }]}>
                      <Text style={styles.divText}>{pftData.division}</Text>
                  </View>
              ) : (
                  <Ionicons name="lock-closed" size={20} color="#666" />
              )}
          </TouchableOpacity>

          {/* 5K CARD */}
          <View style={styles.certCard}>
              <View style={[styles.certIcon, {backgroundColor: runData ? '#32D74B' : '#222'}]}>
                  <Ionicons name="map" size={24} color={runData ? "#000" : "#666"} />
              </View>
              <View style={{flex: 1}}>
                  <Text style={styles.certTitle}>5K CAPACITY TEST</Text>
                  <Text style={styles.certSub}>{runData ? `PACE: ${runData.totalTime}` : "NO DATA"}</Text>
              </View>
          </View>

          {/* 2. CAREER STATS */}
          <View style={[styles.sectionHeader, {marginTop: 30}]}>
              <Ionicons name="stats-chart" size={18} color="#FFD700" />
              <Text style={styles.sectionTitle}>CAREER STATISTICS</Text>
          </View>
          
          <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                  <Text style={styles.statVal}>{stats.ops}</Text>
                  <Text style={styles.statLabel}>MISSIONS</Text>
              </View>
              <View style={styles.statBox}>
                  <Text style={styles.statVal}>{Math.floor(stats.xp / 1000)}k</Text>
                  <Text style={styles.statLabel}>TOTAL XP</Text>
              </View>
              <View style={styles.statBox}>
                  <Text style={styles.statVal}>--</Text>
                  <Text style={styles.statLabel}>STREAK</Text>
              </View>
          </View>

      </ScrollView>

      {/* --- CERTIFICATE MODAL --- */}
      <Modal visible={showCertificate} animationType="slide" transparent>
          <BlurView intensity={95} tint="dark" style={styles.certModal}>
              <View style={styles.certPaper}>
                  <View style={styles.certHeaderRow}>
                      <Ionicons name="ribbon" size={40} color={pftData ? DIVISION_COLORS[pftData.division] : '#fff'} />
                      <TouchableOpacity onPress={() => setShowCertificate(false)}>
                          <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.certHeading}>OFFICIAL CLASSIFICATION</Text>
                  <Text style={styles.certName}>{name}</Text>
                  
                  <View style={styles.divider} />
                  
                  <Text style={styles.certBody}>
                      Based on the Physical Fitness Test performance of <Text style={{fontWeight:'bold'}}>{pftData?.time}</Text>, 
                      this athlete is hereby qualified for deployment in the:
                  </Text>

                  <Text style={[styles.certDivision, { color: pftData ? DIVISION_COLORS[pftData.division] : '#000' }]}>
                      {pftData?.division} DIVISION
                  </Text>

                  <View style={styles.certFooter}>
                      <Text style={styles.certDate}>AUTHORIZED: {new Date().toDateString()}</Text>
                      <Text style={styles.certSig}>HYROX TACTICAL COMMAND</Text>
                  </View>
              </View>
          </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // HERO
  headerBg: { paddingHorizontal: 25, paddingBottom: 30, backgroundColor: '#111' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  rankLabel: { color: '#FFD700', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  nameLabel: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic' },
  levelBadge: { alignItems: 'center', backgroundColor: '#333', width: 50, height: 50, borderRadius: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#444' },
  levelNum: { color: '#fff', fontSize: 20, fontWeight: '900' },
  levelText: { color: '#888', fontSize: 8, fontWeight: 'bold' },
  
  xpBarContainer: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#FFD700' },
  xpText: { color: '#888', fontSize: 10, fontWeight: 'bold', textAlign: 'right' },

  scrollContent: { padding: 25 },
  
  // SECTIONS
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // CARDS
  certCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  certIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  certTitle: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  certSub: { color: '#888', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  divBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  divText: { color: '#000', fontSize: 10, fontWeight: '900' },

  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#161616', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 9, fontWeight: 'bold', marginTop: 4 },

  // MODAL (CERTIFICATE)
  certModal: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  certPaper: { backgroundColor: '#F5F5F5', width: '100%', padding: 30, borderRadius: 4, borderWidth: 4, borderColor: '#222' },
  certHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  certHeading: { fontSize: 12, fontWeight: '900', letterSpacing: 2, textAlign: 'center', color: '#444' },
  certName: { fontSize: 32, fontWeight: '900', textAlign: 'center', fontStyle: 'italic', marginVertical: 10, textDecorationLine: 'underline' },
  divider: { height: 2, backgroundColor: '#000', width: '100%', marginVertical: 20 },
  certBody: { fontSize: 14, textAlign: 'center', lineHeight: 22, color: '#333', fontFamily: 'Courier' }, // Fallback font
  certDivision: { fontSize: 36, fontWeight: '900', textAlign: 'center', marginVertical: 30, letterSpacing: -1 },
  certFooter: { marginTop: 20, alignItems: 'center' },
  certDate: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  certSig: { fontSize: 12, fontWeight: '900', marginTop: 5, letterSpacing: 1 },
});