import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';
import AppointmentCard from '../../src/components/AppointmentCard';

const FILTERS = ['All', 'Upcoming', 'Completed', 'Rejected'];

const STATUS_FILTER = {
  All: null,
  Upcoming: ['Pending RS Acceptance', 'Confirmed', 'In Progress'],
  Completed: ['Session Summary Submitted', 'Finished'],
  Rejected: ['Rejected'],
};

export default function AppointmentsScreen() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [rateTarget, setRateTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments(),
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating, feedback }) => api.rateAppointment(id, rating, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setRateTarget(null);
      setFeedback('');
      setRating(5);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const filtered = (appointments || []).filter((a) => {
    const statuses = STATUS_FILTER[filter];
    return statuses ? statuses.includes(a.status) : true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    setRefreshing(false);
  };

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗂 {t.appointments}</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, filter === f && styles.pillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>{t[f.toLowerCase()] || f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}><Text style={styles.loadingText}>Loading…</Text></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>{t.noAppointments}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onRate={setRateTarget}
              onBookAgain={() => {/* navigate to book tab */}}
            />
          )}
        />
      )}

      {/* Rate & Review Modal */}
      <Modal visible={!!rateTarget} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setRateTarget(null)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>⭐ {t.rateSession}</Text>
            <TouchableOpacity onPress={() => setRateTarget(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <Text style={styles.rateLabel}>
              {rateTarget?.provider_name}
            </Text>
            {/* Star selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.feedbackInput}
              placeholder={t.yourFeedback}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={feedback}
              onChangeText={setFeedback}
            />
            <TouchableOpacity
              style={[styles.btn, rateMutation.isPending && styles.btnDisabled]}
              onPress={() => rateMutation.mutate({ id: rateTarget.id, rating, feedback })}
              disabled={rateMutation.isPending}
            >
              <Text style={styles.btnText}>
                {rateMutation.isPending ? 'Submitting…' : t.submitRating}
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
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  pillActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  pillTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  closeBtn: { fontSize: 18, color: '#94a3b8', padding: 4 },
  sheetBody: { padding: 20 },
  rateLabel: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  star: { fontSize: 40, color: '#e2e8f0' },
  starActive: { color: '#f59e0b' },
  feedbackInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
