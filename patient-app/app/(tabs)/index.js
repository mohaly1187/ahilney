import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, FlatList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import AppointmentCard from '../../src/components/AppointmentCard';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { patient } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [notifVisible, setNotifVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments(),
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications,
    refetchInterval: 30_000,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: api.wallet,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const upcoming = (appointments || []).find(
    (a) => ['Pending RS Acceptance', 'Confirmed', 'In Progress'].includes(a.status)
  );
  const unread = (notifications || []).filter((n) => !n.is_read);

  const firstName = (patient?.name || '').split(' ')[0];

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{firstName || 'Patient'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => setNotifVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unread.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Wallet summary strip */}
        {walletData != null && (
          <View style={styles.walletStrip}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletAmt}>{walletData.balance ?? 0} EGP</Text>
          </View>
        )}

        {/* Upcoming appointment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 {t.upcomingAppointment}</Text>
          {upcoming ? (
            <AppointmentCard appointment={upcoming} compact />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.noUpcoming}</Text>
              <Text style={styles.emptyHint}>Book a session from the Book tab.</Text>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickGrid}>
            {[
              { emoji: '🏠', label: 'Home Visit' },
              { emoji: '💻', label: 'Online Consult' },
              { emoji: '🗂', label: 'My Appointments' },
              { emoji: '💳', label: 'Wallet' },
            ].map((item) => (
              <View key={item.label} style={styles.quickTile}>
                <Text style={styles.quickEmoji}>{item.emoji}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={notifVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setNotifVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>🔔 {t.notifications}</Text>
            <TouchableOpacity onPress={() => setNotifVisible(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          {(notifications || []).length === 0 ? (
            <View style={styles.emptyNotif}>
              <Text style={styles.emptyNotifText}>{t.noNotifications}</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => String(item.id)}
              style={styles.notifList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notifItem, !item.is_read && styles.notifUnread]}
                  onPress={() => markReadMutation.mutate(item.id)}
                >
                  <View style={styles.notifDot}>
                    {!item.is_read && <View style={styles.dot} />}
                  </View>
                  <View style={styles.notifBody}>
                    <Text style={styles.notifText}>{item.message}</Text>
                    <Text style={styles.notifTime}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  notifIcon: { fontSize: 20 },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  walletStrip: { backgroundColor: '#0d9488', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  walletAmt: { color: '#fff', fontSize: 22, fontWeight: '800' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  emptyHint: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickTile: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#0f172a', textAlign: 'center' },
  // Modal / sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  closeBtn: { fontSize: 18, color: '#94a3b8', padding: 4 },
  notifList: { maxHeight: 400 },
  notifItem: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  notifUnread: { backgroundColor: '#f0fdfa' },
  notifDot: { width: 20, alignItems: 'center', paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0d9488' },
  notifBody: { flex: 1 },
  notifText: { fontSize: 13, color: '#0f172a', lineHeight: 18 },
  notifTime: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  emptyNotif: { padding: 40, alignItems: 'center' },
  emptyNotifText: { fontSize: 14, color: '#94a3b8' },
});
