import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataStore, LogEntry } from './services/DataStore';

// Configure Calendar Locale
LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};
LocaleConfig.defaultLocale = 'en';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedLogs, setSelectedLogs] = useState<LogEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const data = await DataStore.getHistory();
      setHistory(data);
      processMarks(data);
      filterLogsForDate(selectedDate, data);
    } catch (e) {
      console.log("Calendar load error", e);
    }
  };

  const normalizeDate = (dateStr: string) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
      }
      return null;
  };

  const processMarks = (data: LogEntry[]) => {
      const marks: any = {};
      data.forEach(item => {
          const isoDate = normalizeDate(item.date);
          if (isoDate) {
              let dotColor = '#32D74B'; 
              if (item.type === 'SIMULATION') dotColor = '#FFD700'; 
              else if (item.sessionType === 'TRAINING') dotColor = '#0A84FF'; 

              if (marks[isoDate]) {
                  if (item.type === 'SIMULATION') marks[isoDate].dots = [{ color: '#FFD700' }];
              } else {
                  marks[isoDate] = { dots: [{ color: dotColor }] };
              }
          }
      });
      setMarkedDates(marks);
  };

  const filterLogsForDate = (targetIsoDate: string, dataSet = history) => {
      const logs = dataSet.filter(h => {
          const itemIso = normalizeDate(h.date);
          return itemIso === targetIsoDate;
      });
      setSelectedLogs(logs);
  };

  const onDayPress = (day: any) => {
      setSelectedDate(day.dateString);
      filterLogsForDate(day.dateString, history); 
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    let icon = 'time'; 
    let color = '#888';
    
    if (item.type === 'SIMULATION') { icon = 'trophy'; color = '#FFD700'; }
    else if (item.sessionType === 'TRAINING') { icon = 'flash'; color = '#0A84FF'; }
    else if (item.type === 'RUN' || item.title.includes('RUN')) { icon = 'map'; color = '#32D74B'; }

    const displayTitle = item.title || "UNTITLED";
    const displaySub = item.totalTime || "--:--";
    const displayWeight = item.details?.weight && item.details.weight !== '0' ? ` • ${item.details.weight}kg` : '';

    return (
      <TouchableOpacity 
        style={styles.logCard}
        onPress={() => {
             if (item.sessionType === 'QUICK LOG') {
                router.push({ pathname: '/manual_log_details', params: { data: JSON.stringify(item) } });
             } else {
                router.push({ 
                    pathname: '/log_details', 
                    params: { 
                        data: JSON.stringify(item.splits || []),
                        date: item.date,
                        totalTime: item.totalTime,
                        sessionType: item.sessionType,
                        // [FIX] Derived from date instead of looking for 'completedAt' property
                        completedAt: new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                    } 
                });
             }
        }}
      >
          <View style={[styles.iconBox, { backgroundColor: color }]}>
             <Ionicons name={icon as any} size={14} color="#000" />
          </View>
          <View style={{flex: 1}}>
              <Text style={styles.logTitle}>{displayTitle}</Text>
              <Text style={styles.logTime}>{displaySub}{displayWeight}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OPERATIONAL <Text style={{color: '#FFD700'}}>CALENDAR</Text></Text>
          <View style={{width: 24}} /> 
      </View>

      <View style={{ marginBottom: 20 }}>
        <Calendar
            theme={{
                backgroundColor: '#000',
                calendarBackground: '#000',
                textSectionTitleColor: '#666',
                selectedDayBackgroundColor: '#FFD700',
                selectedDayTextColor: '#000',
                todayTextColor: '#FFD700',
                dayTextColor: '#fff',
                textDisabledColor: '#333',
                dotColor: '#FFD700',
                selectedDotColor: '#000',
                arrowColor: '#FFD700',
                monthTextColor: '#fff',
                textDayFontWeight: '600',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '900',
                textDayFontSize: 14,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 10
            }}
            onDayPress={onDayPress}
            markedDates={{
                ...markedDates,
                [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#FFD700' }
            }}
            markingType={'multi-dot'}
        />
      </View>

      <View style={styles.detailsPanel}>
          <Text style={styles.dateHeader}>
              {new Date(selectedDate).toDateString().toUpperCase()}
          </Text>
          
          <FlatList 
            data={selectedLogs}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={renderLogItem}
            contentContainerStyle={{ paddingBottom: 50 }}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>NO DATA LOGGED</Text>
                    <Text style={styles.emptySub}>Rest day or no activity recorded.</Text>
                </View>
            }
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  closeBtn: { padding: 5 },

  detailsPanel: { flex: 1, backgroundColor: '#121212', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  dateHeader: { color: '#666', fontSize: 14, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
  
  logCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  logTime: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  
  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  emptyText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  emptySub: { color: '#666', fontSize: 12, marginTop: 4 },
});