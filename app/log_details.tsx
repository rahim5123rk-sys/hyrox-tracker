import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

// --- MASSIVE AI COACH DATABASE ---
const COACHING_DATABASE: any = {
  CRITICAL_FAILURE: [
    "Tactical error at {worst}. You're red-lining too early. Hyrox is won in the second half, not the first.",
    "Engine failure at {worst}. You over-pulled on the Sleds and paid for it here. Breathe more, pull less.",
    "The lactate trap caught you at {worst}. Stop racing the person in the next lane and race your own ghost.",
    "Total collapse at {worst}. Your central nervous system was fried. Back off 5% on the run before this next time."
  ],
  STRENGTH_GAP: [
    "Runs are elite, but {worst} is bleeding your clock. Add heavy carries to your Sunday session.",
    "You're a natural runner, but {worst} proved you need more raw power. Time to live in the squat rack.",
    "Solid aerobic base, but {worst} was a grind. Focus on compromised grip work to keep your HR lower.",
    "Technical sloppy work at {worst}. Efficiency beats effort on heavy stations. Stay low, drive hard."
  ],
  AEROBIC_GAP: [
    "You crush the weights, but your 1km loops are too slow. More Zone 2 work is non-negotiable.",
    "Power is there, but you can't recover between stations. Your recovery pace is currently a survival pace.",
    "Elite strength at the stations, but the running 'distraction' is hurting you. Volume is the only fix.",
    "Stop walking the Roxzone. Every second standing still is a second you'll never get back."
  ],
  ELITE: [
    "Clinical performance. You stayed ahead of the ghost pacer. It's time to set a sub-{time} goal.",
    "Absolute masterclass in pacing. You didn't just race; you engineered a result.",
    "Textbook execution. You controlled the Sleds and didn't let the runs fall apart. You're ready for Pro.",
    "You've outgrown this target. Stop playing safe and go into the dark place next session."
  ]
};

export default function LogDetails() {
  const router = useRouter();
  const { data, date, totalTime } = useLocalSearchParams();

  let raceData: any[] = [];
  try {
    raceData = data ? JSON.parse(data as string) : [];
  } catch (e) { console.error(e); }

  // --- AI COACH LOGIC ---
  const getAIReport = () => {
    if (raceData.length === 0) return { title: "NO DATA", msg: "Go earn some splits." };

    const sortedByLoss = [...raceData].sort((a, b) => (b.actual - b.target) - (a.actual - a.target));
    const worst = sortedByLoss[0];
    const loss = worst.actual - worst.target;
    
    let tier = "ELITE";
    if (loss > 40) tier = "CRITICAL_FAILURE";
    else if (worst.name.includes("RUN")) tier = "AEROBIC_GAP";
    else tier = "STRENGTH_GAP";

    const phrases = COACHING_DATABASE[tier];
    const rawMsg = phrases[Math.floor(Math.random() * phrases.length)];
    const msg = rawMsg.replace("{worst}", worst.name).replace("{time}", totalTime);

    return { title: tier.replace("_", " "), msg };
  };

  const ai = getAIReport();

  // --- CHART DATA ---
  const actuals = raceData.map(item => item.actual / 60);
  const targets = raceData.map(item => item.target / 60);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK TO LOG</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{date}</Text>
        <Text style={styles.totalTime}>{totalTime}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 60}}>
        
        {/* DYNAMIC AI COACH CARD */}
        <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
                <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI ANALYSIS</Text></View>
                <Text style={styles.aiTitle}>{ai.title}</Text>
            </View>
            <Text style={styles.aiMsg}>"{ai.msg}"</Text>
        </View>

        {/* PERFORMANCE GRAPH */}
        <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>PACING VISUALIZATION</Text>
            <LineChart
                data={{
                    labels: ["S1", "S8", "S16"],
                    datasets: [
                        { data: targets, color: (opacity = 1) => `rgba(100, 100, 100, 0.4)`, strokeWidth: 2, withDots: false },
                        { data: actuals, color: (opacity = 1) => `#FFD700`, strokeWidth: 3 }
                    ]
                }}
                width={screenWidth - 40}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
            />
            <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#FFD700'}]} /><Text style={styles.legendText}>Actual</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#444'}]} /><Text style={styles.legendText}>Target</Text></View>
            </View>
        </View>

        {/* STATION BREAKDOWN */}
        <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>STATION BREAKDOWN</Text>
            {raceData.map((item, i) => (
                <View key={i} style={styles.row}>
                    <View>
                        <Text style={styles.stnName}>{item.name}</Text>
                        <Text style={styles.stnTarget}>Goal: {formatMinSec(item.target)}</Text>
                    </View>
                    <Text style={[styles.stnActual, { color: item.actual <= item.target ? '#FFD700' : '#fff' }]}>
                        {formatMinSec(item.actual)}
                    </Text>
                </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const chartConfig = {
    backgroundGradientFrom: "#121212",
    backgroundGradientTo: "#121212",
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: () => `#666`,
    strokeWidth: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { backgroundColor: '#000', padding: 20, paddingTop: 60, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },
  dateLabel: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  totalTime: { color: '#fff', fontSize: 48, fontWeight: '900', fontStyle: 'italic' },
  
  aiCard: { backgroundColor: '#1E1E1E', margin: 20, padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#FFD700' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiBadge: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
  aiBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  aiTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  aiMsg: { color: '#ccc', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  chartContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: '#444', fontSize: 11, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  chart: { borderRadius: 16 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#666', fontSize: 12 },

  listSection: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  stnName: { color: '#eee', fontSize: 15, fontWeight: 'bold' },
  stnTarget: { color: '#555', fontSize: 11 },
  stnActual: { fontWeight: 'bold', fontSize: 18 }
});