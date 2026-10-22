import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Summary = {
  totalLent: number;
  totalRepaid: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  activeCount: number;
  totalCount: number;
};

export function SummaryCard({ summary }: { summary: Summary | null }) {
  if (!summary) {
    return (
      <View style={styles.card}>
        <Text style={styles.loading}>Loading summary...</Text>
      </View>
    );
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Summary</Text>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={styles.label}>Total Lent</Text>
          <Text style={styles.value}>{fmt(summary.totalLent)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Total Repaid</Text>
          <Text style={[styles.value, { color: '#16a34a' }]}>{fmt(summary.totalRepaid)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Outstanding</Text>
          <Text style={[styles.value, { color: '#2563eb' }]}>{fmt(summary.outstanding)}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.label}>Overdue</Text>
          <Text style={[styles.value, { color: summary.overdueAmount > 0 ? '#dc2626' : '#6b7280' }]}>
            {fmt(summary.overdueAmount)} {summary.overdueCount > 0 ? `(${summary.overdueCount})` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Active loans: {summary.activeCount} • Total: {summary.totalCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  footer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  loading: { textAlign: 'center', color: '#64748b' },
});
