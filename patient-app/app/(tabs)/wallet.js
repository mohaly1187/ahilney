import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';

const TXN_ICONS = {
  Payment: '💳',
  Payout: '💰',
  Refund: '↩️',
  'Refund Issued': '↩️',
  Commission: '📊',
  'Top-up': '⬆️',
};

export default function WalletScreen() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [amount, setAmount] = useState('');

  const { data: walletData, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: api.wallet,
  });

  const topUpMutation = useMutation({
    mutationFn: (amt) => api.topup(Number(amt)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setTopUpVisible(false);
      setAmount('');
      Alert.alert('✅', t.topUpSuccess);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const balance = walletData?.balance ?? 0;
  const transactions = walletData?.transactions || [];

  const renderTransaction = ({ item }) => (
    <View style={styles.txnRow}>
      <View style={styles.txnIcon}>
        <Text style={styles.txnEmoji}>{TXN_ICONS[item.type] || '💱'}</Text>
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnType}>{item.type}</Text>
        <Text style={styles.txnDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date}</Text>
      </View>
      <Text style={[styles.txnAmt, item.type === 'Payment' && styles.txnDebit]}>
        {item.type === 'Payment' ? '-' : '+'}{item.amount} EGP
      </Text>
    </View>
  );

  return (
    <View style={styles.flex}>
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
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={() => setTopUpVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.topUpBtnText}>⬆️ {t.topUp}</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction history */}
        <Text style={styles.sectionTitle}>{t.transactionHistory}</Text>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>{t.noTransactions}</Text>
          </View>
        ) : (
          <View style={styles.txnList}>
            {transactions.map((item) => (
              <View key={item.id}>
                {renderTransaction({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Top-up Modal */}
      <Modal visible={topUpVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setTopUpVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>⬆️ {t.topUp}</Text>
            <TouchableOpacity onPress={() => setTopUpVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <Text style={styles.topUpNote}>{t.topUpNote}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.topUpAmount}
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {['100', '250', '500', '1000'].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickAmt, amount === a && styles.quickAmtActive]}
                  onPress={() => setAmount(a)}
                >
                  <Text style={[styles.quickAmtText, amount === a && styles.quickAmtTextActive]}>
                    {a} EGP
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btn, topUpMutation.isPending && styles.btnDisabled]}
              onPress={() => {
                if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                  Alert.alert('', 'Please enter a valid amount');
                  return;
                }
                topUpMutation.mutate(amount);
              }}
              disabled={topUpMutation.isPending}
            >
              <Text style={styles.btnText}>
                {topUpMutation.isPending ? 'Processing…' : `Add ${amount || 0} EGP`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  heroCard: {
    backgroundColor: '#0d9488', borderRadius: 20, padding: 24,
    marginBottom: 24, overflow: 'hidden', position: 'relative',
  },
  heroCircle1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -30 },
  heroCircle2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: 20 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroAmt: { color: '#fff', fontSize: 36, fontWeight: '800', marginVertical: 8 },
  topUpBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  topUpBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  txnList: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  txnRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  txnIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' },
  txnEmoji: { fontSize: 18 },
  txnInfo: { flex: 1 },
  txnType: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  txnDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txnAmt: { fontSize: 14, fontWeight: '700', color: '#15803d' },
  txnDebit: { color: '#b91c1c' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  closeBtn: { fontSize: 18, color: '#94a3b8', padding: 4 },
  sheetBody: { padding: 20 },
  topUpNote: { fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 18, backgroundColor: '#fef9c3', borderRadius: 8, padding: 10 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, color: '#0f172a', marginBottom: 12 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickAmt: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  quickAmtActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  quickAmtText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  quickAmtTextActive: { color: '#fff' },
  btn: { backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
