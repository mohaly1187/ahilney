import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';

const COMMISSION_RATE = 0.15;

const TXN_ICONS = {
  Payout: '💰',
  Commission: '📊',
  Refund: '↩️',
  'Refund Issued': '↩️',
  Payment: '💳',
};

export default function WalletScreen() {
  const { t } = useI18n();

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: api.wallet,
  });

  const balance = walletData?.balance ?? 0;
  const transactions = walletData?.transactions || [];

  // Compute earnings breakdown from transaction history
  const payouts = transactions.filter((tx) => tx.type === 'Payout');
  const grossEarnings = payouts.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const platformFee = Math.round(grossEarnings * COMMISSION_RATE * 100) / 100;
  const netEarnings = grossEarnings - platformFee;

  // Pending: session summary submitted but not yet paid out
  const pendingAmt = 0; // No direct field; shown from balance context

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💳 {t.wallet}</Text>
      </View>

      {/* Balance hero card */}
      <View style={styles.heroCard}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <Text style={styles.heroLabel}>{t.balance}</Text>
        <Text style={styles.heroAmt}>{balance} EGP</Text>
        <Text style={styles.heroSubtitle}>Admin-approved payouts</Text>
      </View>

      {/* Earnings breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>📊 {t.earningsBreakdown}</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t.grossEarnings}</Text>
          <Text style={styles.breakdownValue}>{grossEarnings} EGP</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{t.platformFee}</Text>
          <Text style={[styles.breakdownValue, styles.feeText]}>-{platformFee} EGP</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, styles.netLabel]}>{t.netEarnings}</Text>
          <Text style={[styles.breakdownValue, styles.netValue]}>{netEarnings} EGP</Text>
        </View>
      </View>

      {/* Payout history */}
      <Text style={styles.sectionTitle}>{t.payoutHistory}</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading…</Text>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>{t.noPayouts}</Text>
        </View>
      ) : (
        <View style={styles.txnList}>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txnRow}>
              <View style={[styles.txnIconBox, tx.type === 'Payout' ? styles.txnCredit : styles.txnNeutral]}>
                <Text style={styles.txnEmoji}>{TXN_ICONS[tx.type] || '💱'}</Text>
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnType}>{tx.type}</Text>
                <Text style={styles.txnDate}>
                  {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : tx.date}
                </Text>
                {tx.appointment_id && (
                  <Text style={styles.txnRef}>Appt #{tx.appointment_id}</Text>
                )}
              </View>
              <Text style={[styles.txnAmt, tx.type === 'Payout' && styles.txnAmtCredit]}>
                +{tx.amount} EGP
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  heroCard: {
    backgroundColor: '#0f766e', borderRadius: 20, padding: 24,
    marginBottom: 16, overflow: 'hidden', position: 'relative',
  },
  heroCircle1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -30 },
  heroCircle2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 20 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroAmt: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 6 },
  heroSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  breakdownCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  breakdownTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  breakdownLabel: { fontSize: 13, color: '#64748b' },
  breakdownValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  feeText: { color: '#dc2626' },
  breakdownDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  netLabel: { fontWeight: '700', color: '#0f172a' },
  netValue: { fontSize: 16, fontWeight: '800', color: '#0d9488' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  txnList: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  txnRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  txnIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnCredit: { backgroundColor: '#dcfce7' },
  txnNeutral: { backgroundColor: '#f0fdfa' },
  txnEmoji: { fontSize: 18 },
  txnInfo: { flex: 1 },
  txnType: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  txnDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txnRef: { fontSize: 10, color: '#64748b', marginTop: 1 },
  txnAmt: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  txnAmtCredit: { color: '#15803d' },
});
