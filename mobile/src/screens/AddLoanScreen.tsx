import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';

export function AddLoanScreen({ navigation }: any) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(''); // YYYY-MM-DD
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ friendName?: string; amount?: string; dueDate?: string }>({});

  const validate = () => {
    const e: any = {};
    if (!friendName.trim() || friendName.trim().length < 2) e.friendName = 'Friend name must be at least 2 chars';
    if (friendName.trim().length > 100) e.friendName = 'Too long';
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Amount must be a positive number';
    if (amt > 1000000) e.amount = 'Amount too large (max 10L)';
    if (!dueDate || isNaN(Date.parse(dueDate))) e.dueDate = 'Invalid due date (YYYY-MM-DD)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need gallery permission to attach receipts');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        friendName: friendName.trim(),
        amount: Number(amount),
        dueDate: new Date(dueDate).toISOString().split('T')[0],
      };
      const created: any = await api.createLoan(payload);

      // If receipt selected, upload it
      if (receiptUri) {
        try {
          await api.uploadReceipt(created.id, receiptUri);
        } catch (e: any) {
          console.warn('Receipt upload failed', e.message);
          Alert.alert('Note', 'Loan created but receipt upload failed: ' + e.message);
        }
      }

      Alert.alert('Success', 'Loan entry added');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Loan Entry</Text>
      <Text style={styles.subtitle}>Who did you lend to? Overdue loans will be highlighted in red.</Text>

      <Text style={styles.label}>Friend Name *</Text>
      <TextInput
        style={[styles.input, errors.friendName && styles.inputError]}
        placeholder="e.g. Rohan Sharma"
        placeholderTextColor="#94a3b8"
        value={friendName}
        onChangeText={setFriendName}
        autoCapitalize="words"
      />
      {errors.friendName && <Text style={styles.error}>{errors.friendName}</Text>}

      <Text style={styles.label}>Amount (₹) *</Text>
      <TextInput
        style={[styles.input, errors.amount && styles.inputError]}
        placeholder="e.g. 1500"
        placeholderTextColor="#94a3b8"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

      <Text style={styles.label}>Due Date *</Text>
      <TextInput
        style={[styles.input, errors.dueDate && styles.inputError]}
        placeholder="YYYY-MM-DD  (e.g. 2026-12-31)"
        placeholderTextColor="#94a3b8"
        value={dueDate}
        onChangeText={setDueDate}
      />
      {errors.dueDate && <Text style={styles.error}>{errors.dueDate}</Text>}
      <Text style={styles.hint}>Tip: Use a past date to test overdue highlighting.</Text>

      <Text style={styles.label}>Receipt Photo (optional)</Text>
      <TouchableOpacity style={styles.outlineBtn} onPress={pickReceipt}>
        <Text style={styles.outlineText}>{receiptUri ? 'Change Receipt' : 'Pick Receipt from Gallery'}</Text>
      </TouchableOpacity>
      {receiptUri && <Image source={{ uri: receiptUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save Entry</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  subtitle: { color: '#64748b', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  error: { color: '#dc2626', fontSize: 12, marginTop: 6, fontWeight: '600' },
  hint: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
  outlineBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineText: { color: '#334155', fontWeight: '700' },
  preview: { width: '100%', height: 200, borderRadius: 12, marginTop: 12, backgroundColor: '#e2e8f0' },
  primaryBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { color: '#64748b', fontWeight: '600' },
});
