import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

type Loan = {
  id: number;
  friend_name: string;
  amount: number;
  due_date: string;
  is_repaid: boolean;
  isOverdue: boolean;
  receipt_url?: string | null;
  created_at: string;
};

export function LoanCard({ loan, onRepay }: { loan: Loan; onRepay: (id: number) => void }) {
  const due = new Date(loan.due_date);
  const dueStr = due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isOverdue = loan.isOverdue;

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard, loan.is_repaid && styles.repaidCard]}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{loan.friend_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{loan.friend_name}</Text>
          <Text style={styles.date}>Due: {dueStr} {isOverdue && !loan.is_repaid ? '• OVERDUE' : ''}</Text>
        </View>
        <Text style={[styles.amount, loan.is_repaid && { color: '#9ca3af', textDecorationLine: 'line-through' }]}>
          ₹{Number(loan.amount).toLocaleString('en-IN')}
        </Text>
      </View>

      {loan.receipt_url && (
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Receipt attached ✓</Text>
        </View>
      )}

      <View style={styles.bottomRow}>
        <View style={[styles.badge, isOverdue ? styles.badgeOverdue : loan.is_repaid ? styles.badgeRepaid : styles.badgeActive]}>
          <Text style={[styles.badgeText, isOverdue && { color: '#991b1b' }, loan.is_repaid && { color: '#065f46' }]}>
            {loan.is_repaid ? 'Repaid' : isOverdue ? 'Overdue' : 'Active'}
          </Text>
        </View>

        {!loan.is_repaid && (
          <TouchableOpacity style={styles.repayBtn} onPress={() => onRepay(loan.id)}>
            <Text style={styles.repayText}>Mark Repaid</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overdueCard: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  repaidCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    opacity: 0.9,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  date: { fontSize: 12, color: '#64748b', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  receiptRow: { marginTop: 10 },
  receiptLabel: { fontSize: 12, color: '#059669', fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f1f5f9' },
  badgeOverdue: { backgroundColor: '#fee2e2' },
  badgeRepaid: { backgroundColor: '#dcfce7' },
  badgeActive: { backgroundColor: '#dbeafe' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  repayBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  repayText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
