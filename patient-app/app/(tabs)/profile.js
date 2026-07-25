import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';

export default function ProfileScreen() {
  const { patient, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.profile,
  });

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const data = profile || patient || {};
  const initials = (data.name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('');

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar & name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{data.name || '—'}</Text>
        <Text style={styles.phone}>{data.phone || patient?.phone || '—'}</Text>
        {data.address && <Text style={styles.address}>📍 {data.address}</Text>}
      </View>

      {/* Medical history */}
      {data.medical_history && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🩺 {t.medicalHistory}</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>{data.medical_history}</Text>
          </View>
        </View>
      )}

      {/* Prescription */}
      {data.prescription_text && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 {t.prescription}</Text>
          <View style={styles.card}>
            {data.prescription_doctor && (
              <Text style={styles.prescriptionDoctor}>Dr. {data.prescription_doctor}</Text>
            )}
            <Text style={styles.cardText}>{data.prescription_text}</Text>
          </View>
        </View>
      )}

      {/* Treatment plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 {t.treatmentPlans}</Text>
        {(data.treatment_plans || []).length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.noTreatmentPlans}</Text>
          </View>
        ) : (
          (data.treatment_plans || []).map((plan, i) => (
            <View key={i} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planDoctor}>{plan.doctor_name}</Text>
                <Text style={styles.planDate}>{plan.date}</Text>
              </View>
              <Text style={styles.planDiagnosis}>{plan.diagnosis}</Text>
              <Text style={styles.planText}>{plan.plan_text}</Text>
            </View>
          ))
        )}
      </View>

      {/* Language toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 {t.language}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>
              🇬🇧 {t.english}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'ar' && styles.langBtnActive]}
            onPress={() => setLang('ar')}
          >
            <Text style={[styles.langBtnText, lang === 'ar' && styles.langBtnTextActive]}>
              🇪🇬 {t.arabic}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.signOutText}>🚪 {t.signOut}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 56 },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: '#0d9488',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  initials: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  phone: { fontSize: 14, color: '#64748b', marginTop: 4 },
  address: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardText: { fontSize: 13, color: '#334155', lineHeight: 20 },
  prescriptionDoctor: { fontSize: 12, fontWeight: '700', color: '#0d9488', marginBottom: 8 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { color: '#94a3b8', fontSize: 13 },
  planCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4, borderLeftColor: '#0d9488' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  planDoctor: { fontSize: 13, fontWeight: '700', color: '#0d9488' },
  planDate: { fontSize: 11, color: '#94a3b8' },
  planDiagnosis: { fontSize: 12, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  planText: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  langBtnActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  langBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  langBtnTextActive: { color: '#fff' },
  signOutBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#fee2e2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontSize: 14, fontWeight: '700' },
});
