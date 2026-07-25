import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import StatusBadge from '../../src/components/StatusBadge';

const ONBOARDING_STAGES = [
  'stage1', 'stage2', 'stage3', 'stage4', 'stage5',
];

const DOC_STATUS_COLORS = {
  Approved: { bg: '#dcfce7', text: '#15803d' },
  Pending: { bg: '#fef3c7', text: '#d97706' },
  Rejected: { bg: '#fee2e2', text: '#b91c1c' },
};

export default function ProfileScreen() {
  const { provider, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.profile,
  });

  const data = profile || provider || {};
  const initials = (data.name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('');

  // Determine onboarding step from profile status + documents
  const getOnboardingStep = () => {
    if (!data.status) return 0;
    if (data.status === 'active') return 5;
    if (data.contract_signed) return 4;
    if (data.interview_date) return 3;
    const docs = data.documents || [];
    if (docs.length > 0) return 2;
    return 1;
  };
  const onboardingStep = getOnboardingStep();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroCircle} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{data.name || '—'}</Text>
        <Text style={styles.heroSpec}>{data.specialty || data.type || '—'}</Text>
        {data.rating != null && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStars}>{'★'.repeat(Math.round(Number(data.rating)))}</Text>
            <Text style={styles.ratingValue}>{Number(data.rating).toFixed(1)}</Text>
            {data.review_count > 0 && (
              <Text style={styles.ratingCount}>({data.review_count} reviews)</Text>
            )}
          </View>
        )}
      </View>

      {/* Info block */}
      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Provider Details</Text>
        {[
          { label: t.specialty, value: data.specialty },
          { label: t.type, value: data.type },
          { label: 'Email', value: data.email },
          { label: 'Phone', value: data.phone },
          { label: 'Status', value: data.status },
        ].map(({ label, value }) => value ? (
          <View key={label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ) : null)}
        {(data.regions_covered || data.region_name) && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.coverageAreas}</Text>
            <Text style={styles.infoValue}>
              {Array.isArray(data.regions_covered)
                ? data.regions_covered.join(', ')
                : data.region_name || '—'}
            </Text>
          </View>
        )}
      </View>

      {/* Documents */}
      {(data.documents || []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 {t.documents}</Text>
          {(data.documents || []).map((doc, i) => {
            const colors = DOC_STATUS_COLORS[doc.status] || DOC_STATUS_COLORS['Pending'];
            return (
              <View key={i} style={styles.docCard}>
                <Text style={styles.docName} numberOfLines={1}>{doc.document_name || doc.name}</Text>
                <View style={[styles.docBadge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.docBadgeText, { color: colors.text }]}>{doc.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Onboarding progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 {t.onboardingStages}</Text>
        <View style={styles.stagesContainer}>
          {ONBOARDING_STAGES.map((key, i) => {
            const step = i + 1;
            const isDone = onboardingStep >= step;
            const isCurrent = onboardingStep === step - 1;
            return (
              <View key={key} style={styles.stageItem}>
                <View style={[
                  styles.stageDot,
                  isDone && styles.stageDotDone,
                  isCurrent && styles.stageDotCurrent,
                ]}>
                  <Text style={[styles.stageDotText, isDone && styles.stageDotTextDone]}>
                    {isDone ? '✓' : step}
                  </Text>
                </View>
                {i < ONBOARDING_STAGES.length - 1 && (
                  <View style={[styles.stageLine, isDone && styles.stageLineDone]} />
                )}
                <Text style={[styles.stageLabel, isDone && styles.stageLabelDone]}>
                  {t[key]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Language toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 {t.language}</Text>
        <View style={styles.langRow}>
          {['en', 'ar'].map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.langBtn, lang === l && styles.langBtnActive]}
              onPress={() => setLang(l)}
            >
              <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                {l === 'en' ? '🇬🇧 ' + t.english : '🇪🇬 ' + t.arabic}
              </Text>
            </TouchableOpacity>
          ))}
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
  heroCard: {
    backgroundColor: '#0d9488', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16, overflow: 'hidden',
  },
  heroCircle: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)', top: -40, right: -40 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSpec: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingStars: { color: '#fef3c7', fontSize: 14 },
  ratingValue: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ratingCount: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  infoBlock: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3, color: '#64748b' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 12, color: '#64748b' },
  infoValue: { fontSize: 12, fontWeight: '600', color: '#0f172a', flex: 1, textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  docCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  docName: { flex: 1, fontSize: 13, color: '#0f172a', fontWeight: '500', marginRight: 8 },
  docBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  docBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  stagesContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  stageItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  stageDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stageDotDone: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  stageDotCurrent: { borderColor: '#0d9488' },
  stageDotText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  stageDotTextDone: { color: '#fff' },
  stageLine: { position: 'absolute', left: 15, top: 40, width: 2, height: 16, backgroundColor: '#e2e8f0', display: 'none' },
  stageLineDone: { backgroundColor: '#0d9488' },
  stageLabel: { fontSize: 13, color: '#64748b', flex: 1 },
  stageLabelDone: { color: '#0f172a', fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  langBtnActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  langBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  langBtnTextActive: { color: '#fff' },
  signOutBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#fee2e2', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontSize: 14, fontWeight: '700' },
});
