import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_SHIFTS = {
  Mon: [{ start: '09:00 AM', end: '11:00 AM' }, { start: '06:00 PM', end: '09:00 PM' }],
  Tue: [{ start: '09:00 AM', end: '11:00 AM' }, { start: '06:00 PM', end: '09:00 PM' }],
  Wed: [{ start: '09:00 AM', end: '11:00 AM' }],
  Thu: [{ start: '09:00 AM', end: '11:00 AM' }],
  Fri: [],
  Sat: [],
  Sun: [],
};

export default function ScheduleScreen() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [shifts, setShifts] = useState(DEFAULT_SHIFTS);
  const [addingDay, setAddingDay] = useState(null);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const { data: scheduleData } = useQuery({
    queryKey: ['schedule'],
    queryFn: api.schedule,
  });

  useEffect(() => {
    if (scheduleData?.shifts) {
      setShifts({ ...DEFAULT_SHIFTS, ...scheduleData.shifts });
    }
  }, [scheduleData]);

  const saveMutation = useMutation({
    mutationFn: (s) => api.updateSchedule(s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      Alert.alert('✅', t.scheduleSaved);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const removeShift = (day, idx) => {
    setShifts((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== idx),
    }));
  };

  const addShift = () => {
    if (!newStart.trim() || !newEnd.trim()) {
      Alert.alert('', 'Please enter start and end times');
      return;
    }
    setShifts((prev) => ({
      ...prev,
      [addingDay]: [...(prev[addingDay] || []), { start: newStart.trim(), end: newEnd.trim() }],
    }));
    setAddingDay(null);
    setNewStart('');
    setNewEnd('');
  };

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📅 {t.mySchedule}</Text>
          <Text style={styles.subtitle}>Set your weekly availability. Patients can only book during your active shifts.</Text>
        </View>

        {DAYS.map((day) => (
          <View key={day} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{t[day] || day}</Text>
              <TouchableOpacity
                style={styles.addShiftBtn}
                onPress={() => { setAddingDay(day); setNewStart(''); setNewEnd(''); }}
              >
                <Text style={styles.addShiftBtnText}>{t.addShift}</Text>
              </TouchableOpacity>
            </View>
            {(shifts[day] || []).length === 0 ? (
              <Text style={styles.noShifts}>{t.noShifts}</Text>
            ) : (
              <View style={styles.shiftChips}>
                {(shifts[day] || []).map((s, i) => (
                  <View key={i} style={styles.shiftChip}>
                    <Text style={styles.shiftChipText}>{s.start} – {s.end}</Text>
                    <TouchableOpacity onPress={() => removeShift(day, i)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && styles.btnDisabled]}
          onPress={() => saveMutation.mutate(shifts)}
          disabled={saveMutation.isPending}
        >
          <Text style={styles.saveBtnText}>
            {saveMutation.isPending ? t.saving : t.saveSchedule}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add shift modal */}
      <Modal visible={!!addingDay} animationType="slide" transparent>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setAddingDay(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>+ Add Shift — {t[addingDay] || addingDay}</Text>
            <TouchableOpacity onPress={() => setAddingDay(null)}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sheetBody}>
            <Text style={styles.sheetSubtitle}>Enter times in 12h format (e.g. 09:00 AM)</Text>
            <Text style={styles.inputLabel}>{t.shiftStart}</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00 AM"
              placeholderTextColor="#94a3b8"
              value={newStart}
              onChangeText={setNewStart}
              autoFocus
            />
            <Text style={styles.inputLabel}>{t.shiftEnd}</Text>
            <TextInput
              style={styles.input}
              placeholder="11:00 AM"
              placeholderTextColor="#94a3b8"
              value={newEnd}
              onChangeText={setNewEnd}
              returnKeyType="done"
              onSubmitEditing={addShift}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addShift}>
              <Text style={styles.addBtnText}>Add Shift</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 18 },
  dayBlock: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  addShiftBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#0d9488', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  addShiftBtnText: { fontSize: 11, fontWeight: '700', color: '#0d9488' },
  noShifts: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  shiftChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  shiftChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdfa', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#ccfbf1' },
  shiftChipText: { fontSize: 12, fontWeight: '600', color: '#0f766e' },
  removeBtn: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 9, color: '#64748b', fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  sheetClose: { fontSize: 18, color: '#94a3b8', padding: 4 },
  sheetBody: { padding: 20 },
  sheetSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 14 },
  addBtn: { backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
