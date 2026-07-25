import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, FlatList, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import StatusBadge from '../../src/components/StatusBadge';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting(h) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ apt, onAccept, onReject }) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>
            {(apt.patient_name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{apt.patient_name}</Text>
          <Text style={styles.patientMeta}>{apt.type} · {apt.scheduled_time}</Text>
        </View>
        <StatusBadge status={apt.status} />
      </View>
      <View style={styles.metaChips}>
        {apt.service_name && (
          <View style={styles.chip}><Text style={styles.chipText}>{apt.service_name}</Text></View>
        )}
        <View style={styles.chip}><Text style={styles.chipText}>{apt.price} EGP</Text></View>
        {apt.scheduled_date && (
          <View style={styles.chip}><Text style={styles.chipText}>📅 {apt.scheduled_date}</Text></View>
        )}
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onAccept(apt)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptBtnText}>✓ Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => onReject(apt)}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectBtnText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Visit Card ───────────────────────────────────────────────────────────────
function VisitCard({ apt, onStartSession }) {
  return (
    <TouchableOpacity style={styles.visitCard} activeOpacity={0.8}>
      <View style={styles.visitHeader}>
        <Text style={styles.visitTime}>{apt.scheduled_time}</Text>
        <StatusBadge status={apt.status} />
      </View>
      <Text style={styles.visitPatient}>{apt.patient_name}</Text>
      <Text style={styles.visitMeta}>{apt.type}{apt.service_name ? ' · ' + apt.service_name : ''}</Text>
      <Text style={styles.visitDate}>{apt.scheduled_date}</Text>
      {apt.status === 'Confirmed' && (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => onStartSession(apt)}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>▶ Start Session</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Summary Form Modal ───────────────────────────────────────────────────────
function SummaryModal({ appointment, notes, onSubmit, onClose, isPending }) {
  const { t } = useI18n();
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [homeExercise, setHomeExercise] = useState('');
  const [nextSession, setNextSession] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSubmit = () => {
    if (!chiefComplaint.trim() || !clinicalFindings.trim() || !treatmentPlan.trim()) {
      Alert.alert('', t.requiredField);
      return;
    }
    onSubmit({
      chief_complaint: chiefComplaint.trim(),
      clinical_findings: clinicalFindings.trim(),
      treatment_plan: treatmentPlan.trim(),
      home_exercise_plan: homeExercise.trim(),
      next_session_recommendation: nextSession.trim(),
      follow_up_date: followUpDate.trim(),
      session_notes: notes,
    });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={styles.summaryScreen}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryHeaderIcon}>📋</Text>
          <Text style={styles.summaryHeaderTitle}>{t.postSessionSummary}</Text>
          <TouchableOpacity onPress={onClose} style={styles.summaryCloseBtn}>
            <Text style={styles.summaryCloseBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.summaryBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.summaryPatient}>
            Patient: {appointment?.patient_name}
          </Text>

          {[
            { label: t.chiefComplaint, value: chiefComplaint, set: setChiefComplaint, required: true },
            { label: t.clinicalFindings, value: clinicalFindings, set: setClinicalFindings, required: true },
            { label: t.treatmentPlan, value: treatmentPlan, set: setTreatmentPlan, required: true },
            { label: t.homeExercise, value: homeExercise, set: setHomeExercise },
            { label: t.nextSession, value: nextSession, set: setNextSession },
          ].map((field) => (
            <View key={field.label} style={styles.formGroup}>
              <Text style={styles.formLabel}>{field.label}</Text>
              <TextInput
                style={styles.formTextarea}
                value={field.value}
                onChangeText={field.set}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder={field.required ? 'Required' : 'Optional'}
                placeholderTextColor="#94a3b8"
              />
            </View>
          ))}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t.followUpDate}</Text>
            <TextInput
              style={styles.formInput}
              value={followUpDate}
              onChangeText={setFollowUpDate}
              placeholder="YYYY-MM-DD (optional)"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={styles.summaryFooter}>
          <TouchableOpacity
            style={[styles.submitBtn, isPending && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            <Text style={styles.submitBtnText}>
              {isPending ? t.submitting : t.submitSummary}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Clinical Session Room ────────────────────────────────────────────────────
function SessionRoom({ appointment, onClose }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const summaryMutation = useMutation({
    mutationFn: (data) => api.submitSummary(appointment.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setShowSummary(false);
      onClose();
      Alert.alert('✅', t.summarySuccess);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleEndSession = () => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Session', style: 'destructive', onPress: () => setShowSummary(true) },
    ]);
  };

  if (showSummary) {
    return (
      <SummaryModal
        appointment={appointment}
        notes={notes}
        onSubmit={(data) => summaryMutation.mutate(data)}
        onClose={() => setShowSummary(false)}
        isPending={summaryMutation.isPending}
      />
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View style={styles.sessionRoom}>
        {/* Header */}
        <View style={styles.crHeader}>
          <View>
            <Text style={styles.crTitle}>{t.sessionRoom}</Text>
            <Text style={styles.crPatientLabel}>{appointment?.patient_name}</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>{t.live}</Text>
          </View>
        </View>

        <ScrollView style={styles.crBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Timer */}
          <View style={styles.timerArea}>
            <Text style={styles.timerDisplay}>{formatTimer(elapsed)}</Text>
            <Text style={styles.timerLabel}>{t.sessionDuration}</Text>
          </View>

          {/* Patient info */}
          <View style={styles.crPatientCard}>
            <Text style={styles.crPatientName}>{appointment?.patient_name}</Text>
            <Text style={styles.crPatientMeta}>
              {appointment?.type}{appointment?.service_name ? ' · ' + appointment.service_name : ''}
            </Text>
            {appointment?.scheduled_date && (
              <Text style={styles.crPatientMeta}>📅 {appointment.scheduled_date}</Text>
            )}
          </View>

          {/* Session notes */}
          <View style={styles.crNotesSection}>
            <Text style={styles.crNotesLabel}>{t.sessionNotes}</Text>
            <TextInput
              style={styles.crNotesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder={t.sessionNotesPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.35)"
            />
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.crFooter}>
          <TouchableOpacity style={styles.endSessionBtn} onPress={handleEndSession} activeOpacity={0.85}>
            <Text style={styles.endSessionBtnText}>⬛ {t.endSession}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { provider } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sessionApt, setSessionApt] = useState(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments(),
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications,
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.acceptAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      Alert.alert('✅', 'Appointment accepted. Patient has been notified.');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.rejectAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const startMutation = useMutation({
    mutationFn: (id) => api.startSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      const apt = (appointments || []).find((a) => a.id === id);
      if (apt) setSessionApt(apt);
    },
    onError: (err) => Alert.alert('Error', err.message),
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

  const pending = (appointments || []).filter((a) => a.status === 'Pending RS Acceptance');
  const upcoming = (appointments || []).filter((a) =>
    ['Confirmed', 'In Progress'].includes(a.status)
  );
  const stats = {
    pending: pending.length,
    confirmed: upcoming.length,
    completed: (appointments || []).filter((a) => ['Finished', 'Session Summary Submitted'].includes(a.status)).length,
    rating: provider?.rating ? Number(provider.rating).toFixed(1) : '—',
  };
  const unread = (notifications || []).filter((n) => !n.is_read);
  const firstName = (provider?.name || '').split(' ')[0];

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
            <Text style={styles.greeting}>{greeting(new Date().getHours())},</Text>
            <Text style={styles.name}>{firstName || 'Provider'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifVisible(true)} activeOpacity={0.8}>
            <Text style={styles.notifIcon}>🔔</Text>
            {unread.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: t.pending, value: stats.pending, color: '#d97706', bg: '#fef3c7' },
            { label: t.confirmed, value: stats.confirmed, color: '#15803d', bg: '#dcfce7' },
            { label: t.completed, value: stats.completed, color: '#1d4ed8', bg: '#dbeafe' },
            { label: t.rating, value: stats.rating, color: '#0d9488', bg: '#f0fdfa' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Pending requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ⏳ {t.pendingRequests}
            {pending.length > 0 && <Text style={styles.countBadge}> {pending.length}</Text>}
          </Text>
          {pending.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.noPendingRequests}</Text>
            </View>
          ) : (
            pending.map((apt) => (
              <RequestCard
                key={apt.id}
                apt={apt}
                onAccept={(a) => acceptMutation.mutate(a.id)}
                onReject={(a) => { setRejectTarget(a); setRejectReason(''); }}
              />
            ))
          )}
        </View>

        {/* Upcoming visits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 {t.upcomingVisits}</Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.noUpcomingVisits}</Text>
            </View>
          ) : (
            upcoming.map((apt) => (
              <VisitCard
                key={apt.id}
                apt={apt}
                onStartSession={(a) => startMutation.mutate(a.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Reject reason sheet */}
      <Modal visible={!!rejectTarget} animationType="slide" transparent>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setRejectTarget(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>✕ Reject Booking</Text>
            <TouchableOpacity onPress={() => setRejectTarget(null)}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <Text style={styles.rejectPatient}>{rejectTarget?.patient_name}</Text>
            <Text style={styles.rejectLabel}>{t.rejectReason}</Text>
            <TextInput
              style={styles.rejectInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder={t.rejectPlaceholder}
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              autoFocus
            />
            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRejectTarget(null)}
              >
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmRejectBtn, rejectMutation.isPending && styles.btnDisabled]}
                onPress={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
              >
                <Text style={styles.confirmRejectBtnText}>
                  {rejectMutation.isPending ? 'Rejecting…' : t.confirmReject}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notifications modal */}
      <Modal visible={notifVisible} animationType="slide" transparent>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setNotifVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>🔔 {t.notifications}</Text>
            <TouchableOpacity onPress={() => setNotifVisible(false)}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {(notifications || []).length === 0 ? (
            <View style={styles.emptyNotif}>
              <Text style={styles.emptyText}>{t.noNotifications}</Text>
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
                  {!item.is_read && <View style={styles.notifDot} />}
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

      {/* Clinical session room */}
      {sessionApt && (
        <SessionRoom
          appointment={sessionApt}
          onClose={() => setSessionApt(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  notifIcon: { fontSize: 20 },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  // Stats
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', color: '#64748b', marginTop: 2, textAlign: 'center' },
  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  countBadge: { color: '#d97706', fontWeight: '800' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 13, color: '#94a3b8' },
  // Request card
  requestCard: { backgroundColor: '#fffdf5', borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 14, marginBottom: 10 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  patientAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 16, fontWeight: '800', color: '#0d9488' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  patientMeta: { fontSize: 11, color: '#64748b', marginTop: 2 },
  metaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { backgroundColor: '#f0fdfa', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#ccfbf1' },
  chipText: { fontSize: 10, fontWeight: '600', color: '#0f766e' },
  actionRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#fef3c7', paddingTop: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#dcfce7', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  acceptBtnText: { color: '#15803d', fontSize: 13, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rejectBtnText: { color: '#b91c1c', fontSize: 13, fontWeight: '700' },
  // Visit card
  visitCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  visitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  visitTime: { fontSize: 15, fontWeight: '800', color: '#0d9488' },
  visitPatient: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  visitMeta: { fontSize: 12, color: '#64748b' },
  visitDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  startBtn: { marginTop: 10, backgroundColor: '#0d9488', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  // Modals
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sheetClose: { fontSize: 18, color: '#94a3b8', padding: 4 },
  sheetBody: { padding: 20 },
  rejectPatient: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  rejectLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  rejectInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
  rejectActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  confirmRejectBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmRejectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  // Notifications
  notifList: { maxHeight: 400 },
  notifItem: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  notifUnread: { backgroundColor: '#f0fdfa' },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0d9488', marginTop: 4, flexShrink: 0 },
  notifBody: { flex: 1 },
  notifText: { fontSize: 13, color: '#0f172a', lineHeight: 18 },
  notifTime: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  emptyNotif: { padding: 32, alignItems: 'center' },
  // Session room
  sessionRoom: { flex: 1, backgroundColor: '#0f172a' },
  crHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingTop: 56 },
  crTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  crPatientLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#dc2626', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  crBody: { flex: 1, padding: 16 },
  timerArea: { alignItems: 'center', paddingVertical: 28 },
  timerDisplay: { fontSize: 56, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  timerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  crPatientCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, marginBottom: 16 },
  crPatientName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  crPatientMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  crNotesSection: { marginTop: 4 },
  crNotesLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  crNotesInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, minHeight: 100, textAlignVertical: 'top' },
  crFooter: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  endSessionBtn: { backgroundColor: '#dc2626', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  endSessionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Summary form
  summaryScreen: { flex: 1, backgroundColor: '#fff' },
  summaryHeader: { backgroundColor: '#0d9488', flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, gap: 10 },
  summaryHeaderIcon: { fontSize: 20 },
  summaryHeaderTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#fff' },
  summaryCloseBtn: { padding: 4 },
  summaryCloseBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 18 },
  summaryBody: { flex: 1, padding: 20 },
  summaryPatient: { fontSize: 14, fontWeight: '700', color: '#0d9488', marginBottom: 16 },
  summaryFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  formTextarea: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 13, color: '#0f172a', minHeight: 80, textAlignVertical: 'top', backgroundColor: '#f8fafc' },
  formInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 13, color: '#0f172a', backgroundColor: '#f8fafc' },
  submitBtn: { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
