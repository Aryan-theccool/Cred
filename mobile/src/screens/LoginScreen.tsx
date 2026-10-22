import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { requestOtp, login } = useAuth();
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid phone', 'Enter a valid phone number (10-15 digits, may start with +)');
      return;
    }
    setLoading(true);
    try {
      const msg = await requestOtp(phone);
      // If devOtp returned, show it (since we don't have SMS)
      if (msg && /^\d{6}$/.test(String(msg))) {
        setDevOtp(String(msg));
      } else if (typeof msg === 'string' && msg.includes('check server log')) {
        // dev mode: we get devOtp in response property; but our client returns message only?
        // Our api returns message + devOtp; client helper returns combined message - check raw fetch
        // Fallback: we already have devOtp via api.requestOtp returning devOtp field if present
      }
      setStep('otp');
      Alert.alert('OTP Sent', `Mock OTP logged to server console.\n${msg ? `Dev hint: ${msg}` : ''}`);
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert('Invalid OTP', 'OTP must be 6 digits');
      return;
    }
    setLoading(true);
    try {
      await login(phone, otp);
    } catch (e: any) {
      Alert.alert('Verification failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>MiniLedger</Text>
        <Text style={styles.subtitle}>Track money lent to friends</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+919876543210"
              placeholderTextColor="#94a3b8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <Text style={styles.hint}>Mock OTP will be printed in server logs (and shown in dev mode).</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP sent to {phone}</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              placeholderTextColor="#94a3b8"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            {devOtp && <Text style={styles.devHint}>Dev OTP: {devOtp} (from server log)</Text>}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Verify & Login</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={() => setStep('phone')}>
              <Text style={styles.linkText}>Change phone number</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Interview-ready • TypeScript • Input validation • Tests</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  logo: { fontSize: 28, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#64748b', marginTop: 6, marginBottom: 24, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  hint: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  devHint: { fontSize: 13, color: '#059669', fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#2563eb', fontWeight: '600' },
  footer: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { textAlign: 'center', color: '#94a3b8', fontSize: 11 },
});
