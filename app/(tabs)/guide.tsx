import { ImageBackground, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function Guide() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>ENGINEER <Text style={{color: '#FFD700'}}>TIPS</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* RUNNING - Verified URL */}
        <GuideCard 
            title="THE RUNNING TRAP"
            img="https://images.unsplash.com/photo-1530143311094-34d807799e8f?q=80&w=800"
            text="Don't sprint the first 1km. Hyrox is an endurance race, not a track meet. Keep your HR at 80% until Run 5."
        />

        {/* SLEDS - Verified URL */}
        <GuideCard 
            title="SLED PUSH SECRETS"
            img="https://images.unsplash.com/photo-1517963879466-e025aecc96e1?q=80&w=800"
            text="Keep your body low. If you stand up, you lose leverage. Aim for short, powerful steps rather than long strides."
        />

        {/* BURPEES - Verified URL */}
        <GuideCard 
            title="BURPEE EFFICIENCY"
            img="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800"
            text="Step back, step up. Jumping is for sprints. Save your explosive power for the Wall Balls at the end."
        />

      </ScrollView>
    </View>
  );
}

function GuideCard({ title, img, text }: any) {
    return (
        <View style={styles.cardContainer}>
            <ImageBackground source={{ uri: img }} style={styles.cardImage} imageStyle={{ borderRadius: 12 }}>
                <View style={styles.cardOverlay}>
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            </ImageBackground>
            <View style={styles.cardBody}>
                <Text style={styles.cardText}>{text}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#000' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', fontStyle: 'italic' },
  scroll: { padding: 20 },
  cardContainer: { marginBottom: 30 },
  cardImage: { width: '100%', height: 160, justifyContent: 'flex-end' },
  cardOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  cardTitle: { color: '#FFD700', fontSize: 18, fontWeight: '900' },
  cardBody: { backgroundColor: '#1E1E1E', padding: 20, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  cardText: { color: '#ccc', fontSize: 14, lineHeight: 22 },
});