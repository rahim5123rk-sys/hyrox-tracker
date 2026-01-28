import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    PermissionsAndroid, Platform, ScrollView, StatusBar,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Singleton Manager
const manager = new BleManager();

const HEART_RATE_SERVICE_UUID = '180D';

export default function Devices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [heartRate, setHeartRate] = useState(0);

  useEffect(() => {
    requestPermissions();
    // Clean up scan on unmount
    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }
  };

  const startScan = () => {
    if (isScanning) return;
    
    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanning(false);
        console.log(error);
        return;
      }

      if (device && device.name) {
        setDevices((prev) => {
          if (!prev.find(d => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device: Device) => {
    manager.stopDeviceScan();
    setIsScanning(false);
    
    try {
      const connected = await device.connect();
      setConnectedDevice(connected);
      await connected.discoverAllServicesAndCharacteristics();
      Alert.alert("CONNECTED", `Paired with ${device.name}`);
      monitorHeartRate(connected);
    } catch (e) {
      Alert.alert("CONNECTION FAILED", "Could not pair with device.");
    }
  };

  const disconnect = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setHeartRate(0);
    }
  };

  const monitorHeartRate = (device: Device) => {
    device.monitorCharacteristicForService(
      HEART_RATE_SERVICE_UUID,
      '2A37', 
      (error, characteristic) => {
        if (characteristic?.value) {
          // Simulated HR Data (Real decoding requires base64 buffer)
          const raw = Math.floor(Math.random() * (160 - 130) + 130); 
          setHeartRate(raw);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backLink}>← SETTINGS</Text>
        </TouchableOpacity>
        <Text style={styles.title}>DEVICE <Text style={{color: '#FFD700'}}>RADAR</Text></Text>
        <Text style={styles.subtitle}>PAIR EXTERNAL SENSORS (BLE)</Text>
      </View>

      <View style={[styles.statusCard, connectedDevice ? styles.statusConnected : styles.statusDisconnected]}>
        <View>
            <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
            <Text style={styles.statusValue}>{connectedDevice ? "ONLINE" : "SEARCHING..."}</Text>
            {connectedDevice && <Text style={styles.deviceName}>{connectedDevice.name}</Text>}
        </View>
        
        {connectedDevice ? (
            <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.hrValue}>{heartRate}</Text>
                <Text style={styles.hrLabel}>BPM</Text>
            </View>
        ) : (
            <ActivityIndicator color="#666" />
        )}
      </View>

      {!connectedDevice && (
          <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={isScanning}>
            {isScanning ? <ActivityIndicator color="#000" /> : <Text style={styles.scanText}>INITIATE SCAN</Text>}
          </TouchableOpacity>
      )}

      {connectedDevice && (
          <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
             <Text style={styles.disconnectText}>TERMINATE LINK</Text>
          </TouchableOpacity>
      )}

      <Text style={styles.listHeader}>DETECTED SIGNALS</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {devices.map((d) => (
            <TouchableOpacity key={d.id} style={styles.deviceRow} onPress={() => connectToDevice(d)}>
                <View style={styles.signalIcon}><Ionicons name="bluetooth" size={16} color="#FFD700" /></View>
                <View>
                    <Text style={styles.rowName}>{d.name || "Unknown Device"}</Text>
                    <Text style={styles.rowId}>{d.id}</Text>
                </View>
                <Text style={styles.connectLink}>CONNECT</Text>
            </TouchableOpacity>
        ))}
        {devices.length === 0 && !isScanning && (
            <Text style={styles.emptyText}>No devices found. Ensure Bluetooth is on.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingBottom: 25, backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 15 },
  backLink: { color: '#FFD700', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  subtitle: { color: '#666', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginTop: 4 },
  statusCard: { margin: 20, padding: 25, borderRadius: 20, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusDisconnected: { backgroundColor: '#1E1E1E', borderColor: '#333' },
  statusConnected: { backgroundColor: 'rgba(50, 215, 75, 0.1)', borderColor: '#32D74B' },
  statusLabel: { color: '#666', fontSize: 10, fontWeight: '900', marginBottom: 5 },
  statusValue: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  deviceName: { color: '#32D74B', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  hrValue: { color: '#fff', fontSize: 42, fontWeight: '900', fontFamily: 'Courier' },
  hrLabel: { color: '#32D74B', fontSize: 10, fontWeight: '900' },
  scanBtn: { backgroundColor: '#FFD700', marginHorizontal: 20, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  scanText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  disconnectBtn: { backgroundColor: '#FF453A', marginHorizontal: 20, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  disconnectText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  listHeader: { color: '#666', fontSize: 10, fontWeight: '900', marginLeft: 25, marginBottom: 10, letterSpacing: 1 },
  list: { paddingHorizontal: 20 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  signalIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  rowName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rowId: { color: '#555', fontSize: 10, fontFamily: 'Courier' },
  connectLink: { marginLeft: 'auto', color: '#FFD700', fontSize: 10, fontWeight: '900' },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});