import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { SummaryCard } from '../components/SummaryCard';
import { LoanCard } from '../components/LoanCard';
import { useAuth } from '../context/AuthContext';

export function HomeScreen({ navigation }: any) {
  const { logout, user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [loansData, summaryData] = await Promise.all([api.getLoans(), api.getSummary()]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleRepay = async (id: number) => {
    Alert.alert('Confirm', 'Mark this loan as repaid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.markRepaid(id);
            load();
          } catch (e: any) {
            Alert.alert('Failed', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.centerText}>Loading ledger...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MiniLedger</Text>
          <Text style={styles.headerSub}>{user?.phone} • {loans.length} entries</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <SummaryCard summary={summary} />
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Loans</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddLoan')}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {loans.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No loans yet</Text>
                <Text style={styles.emptySub}>Tap + Add to create your first entry. Overdue loans will be highlighted in red.</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <LoanCard loan={item} onRepay={handleRepay} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  centerText: { marginTop: 12, color: '#64748b' },
  header: {
    backgroundColor: '#0f172a',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  addBtn: { backgroundColor: '#0f172a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { margin: 16, padding: 24, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  emptyTitle: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  emptySub: { color: '#64748b', textAlign: 'center', marginTop: 8, fontSize: 13, lineHeight: 18 },
});
