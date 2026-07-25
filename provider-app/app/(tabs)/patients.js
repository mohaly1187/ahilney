import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';
import StatusBadge from '../../src/components/StatusBadge';

export default function PatientsScreen() {
  const { t } = useI18n();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments(),
  });

  // Derive unique patients from appointment history
  const patients = useMemo(() => {
    const map = new Map();
    (appointments || []).forEach((apt) => {
      if (!apt.patient_id) return;
      if (!map.has(apt.patient_id)) {
        map.set(apt.patient_id, {
          id: apt.patient_id,
          name: apt.patient_name || 'Unknown',
          appointments: [],
        });
      }
      map.get(apt.patient_id).appointments.push(apt);
    });
    return Array.from(map.values());
  }, [appointments]);

  const filtered = patients.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderPatient = ({ item }) => {
    const initials = item.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
    const completedCount = item.appointments.filter((a) => a.status === 'Finished').length;
    const latestApt = item.appointments[0];

    return (
      <TouchableOpacity
        style={styles.patientCard}
        onPress={() => setSelectedPatient(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientMeta}>
              {completedCount} completed session{completedCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {latestApt && <StatusBadge status={latestApt.status} />}
        </View>
        {latestApt && (
          <Text style={styles.latestApt}>
            Latest: {latestApt.type} · {latestApt.scheduled_date || latestApt.scheduled_time}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 {t.myPatients}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients…"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}><Text style={styles.loadingText}>Loading…</Text></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>{t.noPatients}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderPatient}
        />
      )}

      {/* Patient detail modal */}
      <Modal visible={!!selectedPatient} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.detailScreen}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedPatient(null)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{selectedPatient?.name}</Text>
          </View>

          <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <View style={styles.detailStatsRow}>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>
                  {selectedPatient?.appointments?.length || 0}
                </Text>
                <Text style={styles.detailStatLabel}>Total Appointments</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>
                  {(selectedPatient?.appointments || []).filter((a) => a.status === 'Finished').length}
                </Text>
                <Text style={styles.detailStatLabel}>Completed</Text>
              </View>
            </View>

            {/* Session history */}
            <Text style={styles.detailSectionTitle}>📋 {t.sessionHistory}</Text>
            {(selectedPatient?.appointments || []).length === 0 ? (
              <Text style={styles.emptyText}>{t.noHistory}</Text>
            ) : (
              (selectedPatient?.appointments || []).map((apt) => (
                <View key={apt.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyType}>{apt.type}</Text>
                      <Text style={styles.historyDate}>
                        {apt.scheduled_date || apt.scheduled_time}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <StatusBadge status={apt.status} />
                      <Text style={styles.historyPrice}>{apt.price} EGP</Text>
                    </View>
                  </View>
                  {apt.service_name && (
                    <Text style={styles.historyService}>{apt.service_name}</Text>
                  )}
                  {apt.patient_rating && (
                    <Text style={styles.historyRating}>
                      {'⭐'.repeat(apt.patient_rating)} Patient rating
                    </Text>
                  )}
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', borderWidth: 1.5, borderColor: '#e2e8f0' },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  patientCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#0d9488' },
  info: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  patientMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  latestApt: { fontSize: 11, color: '#94a3b8' },
  // Patient detail
  detailScreen: { flex: 1, backgroundColor: '#f8fafc' },
  detailHeader: { backgroundColor: '#fff', padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: '#0d9488', fontSize: 14, fontWeight: '600' },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  detailBody: { flex: 1, padding: 20 },
  detailStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  detailStat: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  detailStatValue: { fontSize: 28, fontWeight: '800', color: '#0d9488' },
  detailStatLabel: { fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'center' },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  historyLeft: { flex: 1 },
  historyType: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  historyDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  historyPrice: { fontSize: 12, fontWeight: '700', color: '#0d9488', marginTop: 4 },
  historyService: { fontSize: 11, color: '#0d9488', fontWeight: '600' },
  historyRating: { fontSize: 11, color: '#64748b', marginTop: 4 },
});
