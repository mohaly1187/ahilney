import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';
import ProviderCard from '../../src/components/ProviderCard';

// ─── Package options ──────────────────────────────────────────────────────────
const PACKAGES = [
  { sessions: 1, label: '1 Session', discount: 0 },
  { sessions: 5, label: '5 Sessions', discount: 0.05 },
  { sessions: 10, label: '10 Sessions', discount: 0.10 },
];

// ─── Time slots ───────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM',
];

// ─── Next 7 dates ─────────────────────────────────────────────────────────────
function getNextDates(n = 7) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push({
      date: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return dates;
}

// ─── Provider Profile Sheet ───────────────────────────────────────────────────
function ProviderSheet({ provider, onClose, onBook }) {
  if (!provider) return null;
  const initials = (provider.name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('');

  return (
    <Modal visible={!!provider} animationType="slide" transparent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.providerSheetHeader}>
            <View style={styles.providerSheetAvatar}>
              <Text style={styles.providerSheetInitials}>{initials}</Text>
            </View>
            <Text style={styles.providerSheetName}>{provider.name}</Text>
            <Text style={styles.providerSheetSpec}>{provider.specialty || provider.type}</Text>
            {provider.rating != null && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStars}>{'★'.repeat(Math.round(Number(provider.rating)))}</Text>
                <Text style={styles.ratingValue}>{Number(provider.rating).toFixed(1)}</Text>
                {provider.review_count > 0 && (
                  <Text style={styles.ratingCount}>({provider.review_count} reviews)</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Per session</Text>
              <Text style={styles.priceValue}>{provider.price_per_session} EGP</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Duration</Text>
              <Text style={styles.priceValue}>{provider.session_duration || 45} min</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Type</Text>
              <Text style={styles.priceValue}>{provider.type || 'RS'}</Text>
            </View>
          </View>

          {provider.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>About</Text>
              <Text style={styles.bioText}>{provider.bio}</Text>
            </View>
          )}

          {provider.services && provider.services.length > 0 && (
            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>Services</Text>
              <View style={styles.serviceChips}>
                {provider.services.map((s, i) => (
                  <View key={i} style={styles.serviceChip}>
                    <Text style={styles.serviceChipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        <View style={styles.sheetFooter}>
          <TouchableOpacity style={styles.bookBtn} onPress={() => onBook(provider)} activeOpacity={0.85}>
            <Text style={styles.bookBtnText}>📅 Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Booking Modal (4 steps) ──────────────────────────────────────────────────
function BookingModal({ provider, wallet, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); // 0=Prescription, 1=Schedule, 2=Package, 3=Confirm
  const [prescription, setPrescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoValidating, setPromoValidating] = useState(false);

  const dates = useMemo(() => getNextDates(7), []);

  const pkg = PACKAGES[selectedPkg];
  const baseTotal = (provider?.price_per_session || 0) * pkg.sessions;
  const discounted = baseTotal * (1 - pkg.discount) * (1 - promoDiscount);
  const total = Math.round(discounted);
  const balance = wallet?.balance ?? 0;
  const canAfford = balance >= total;

  const bookMutation = useMutation({
    mutationFn: (data) => api.bookAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      onSuccess();
    },
    onError: (err) => Alert.alert('Booking Failed', err.message),
  });

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoValidating(true);
    try {
      const result = await api.validatePromo(promoCode.trim(), provider?.id);
      if (result.valid) {
        const disc = parseFloat(result.discount_value) / 100;
        setPromoDiscount(disc);
        Alert.alert('✅', `Promo applied! ${result.discount_value}% off`);
      } else {
        Alert.alert('Invalid', result.message || 'Promo code not valid');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPromoValidating(false);
    }
  };

  const handleBook = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('', 'Please select a date and time');
      setStep(1);
      return;
    }
    bookMutation.mutate({
      provider_id: provider.id,
      scheduled_date: selectedDate,
      scheduled_time: selectedTime,
      session_count: pkg.sessions,
      service_name: 'Physical Therapy (PT)',
      type: 'Home Visit',
      promo_code: promoCode.trim() || undefined,
    });
  };

  const STEP_LABELS = ['Prescription', 'Schedule', 'Package', 'Confirm'];

  return (
    <Modal visible={!!provider} animationType="slide" transparent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.bookingSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Book with {provider?.name?.split(' ')[0]}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEP_LABELS.map((label, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]}>
                <Text style={[styles.stepNum, (i === step || i < step) && styles.stepNumActive]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView style={styles.bookingBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Step 0: Prescription */}
          {step === 0 && (
            <View>
              <Text style={styles.stepHeading}>📋 Add Prescription (optional)</Text>
              <Text style={styles.stepHint}>
                If you have a prescription from a doctor, you can paste the details here. This helps the specialist prepare for your session.
              </Text>
              <TextInput
                style={styles.prescriptionInput}
                placeholder="Paste your prescription details or notes here…"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={5}
                value={prescription}
                onChangeText={setPrescription}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Step 1: Schedule */}
          {step === 1 && (
            <View>
              <Text style={styles.stepHeading}>📅 Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {dates.map((d) => (
                  <TouchableOpacity
                    key={d.date}
                    style={[styles.dateChip, selectedDate === d.date && styles.dateChipActive]}
                    onPress={() => setSelectedDate(d.date)}
                  >
                    <Text style={[styles.dateChipText, selectedDate === d.date && styles.dateChipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.stepHeading, { marginTop: 20 }]}>⏰ Select Time</Text>
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeChip, selectedTime === slot && styles.timeChipActive]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text style={[styles.timeChipText, selectedTime === slot && styles.timeChipTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Package */}
          {step === 2 && (
            <View>
              <Text style={styles.stepHeading}>📦 Select Package</Text>
              <Text style={styles.stepHint}>More sessions = bigger discount</Text>
              {PACKAGES.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.pkgCard, selectedPkg === i && styles.pkgCardActive]}
                  onPress={() => setSelectedPkg(i)}
                >
                  <View style={styles.pkgLeft}>
                    <Text style={[styles.pkgLabel, selectedPkg === i && styles.pkgLabelActive]}>{p.label}</Text>
                    {p.discount > 0 && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{p.discount * 100}% OFF</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.pkgRight}>
                    {p.discount > 0 && (
                      <Text style={styles.pkgOriginal}>
                        {(provider?.price_per_session || 0) * p.sessions} EGP
                      </Text>
                    )}
                    <Text style={[styles.pkgPrice, selectedPkg === i && styles.pkgPriceActive]}>
                      {Math.round((provider?.price_per_session || 0) * p.sessions * (1 - p.discount))} EGP
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Promo code */}
              <Text style={[styles.stepHeading, { marginTop: 20 }]}>🏷 Promo Code</Text>
              <View style={styles.promoRow}>
                <TextInput
                  style={[styles.promoInput, promoDiscount > 0 && styles.promoInputSuccess]}
                  placeholder="Enter code"
                  placeholderTextColor="#94a3b8"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.promoBtn, promoValidating && styles.btnDisabled]}
                  onPress={validatePromo}
                  disabled={promoValidating}
                >
                  <Text style={styles.promoBtnText}>{promoValidating ? '…' : 'Apply'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <View>
              <Text style={styles.stepHeading}>✅ Confirm Booking</Text>

              <View style={styles.summaryCard}>
                <SummaryRow label="Provider" value={provider?.name} />
                <SummaryRow label="Date" value={selectedDate || '—'} />
                <SummaryRow label="Time" value={selectedTime || '—'} />
                <SummaryRow label="Sessions" value={`${pkg.sessions} session${pkg.sessions > 1 ? 's' : ''}`} />
                {promoDiscount > 0 && (
                  <SummaryRow label="Promo Discount" value={`-${promoDiscount * 100}%`} highlight />
                )}
                <View style={styles.summaryDivider} />
                <SummaryRow label="Total" value={`${total} EGP`} bold />
              </View>

              {/* Wallet balance */}
              <View style={[styles.walletCheck, canAfford ? styles.walletOk : styles.walletLow]}>
                <Text style={styles.walletCheckIcon}>{canAfford ? '✅' : '⚠️'}</Text>
                <View>
                  <Text style={styles.walletCheckLabel}>Wallet Balance</Text>
                  <Text style={styles.walletCheckAmt}>{balance} EGP</Text>
                </View>
              </View>

              {!canAfford && (
                <Text style={styles.insufficientText}>
                  Insufficient balance. Please top up your wallet first.
                </Text>
              )}

              {selectedDate && selectedTime && (
                <View style={styles.appointmentPreview}>
                  <Text style={styles.appointmentPreviewText}>
                    📅 {selectedDate} at {selectedTime}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer navigation */}
        <View style={styles.bookingFooter}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextBtn, step === 0 && { marginLeft: 0 }]}
              onPress={() => {
                if (step === 1 && (!selectedDate || !selectedTime)) {
                  Alert.alert('', 'Please select both a date and a time slot');
                  return;
                }
                setStep(step + 1);
              }}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, (!canAfford || bookMutation.isPending) && styles.btnDisabled]}
              onPress={handleBook}
              disabled={!canAfford || bookMutation.isPending}
            >
              <Text style={styles.nextBtnText}>
                {bookMutation.isPending ? 'Booking…' : '✓ Confirm & Pay'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SummaryRow({ label, value, bold, highlight }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[
        styles.summaryValue,
        bold && styles.summaryBold,
        highlight && styles.summaryHighlight,
      ]}>{value}</Text>
    </View>
  );
}

// ─── Main Book Screen ─────────────────────────────────────────────────────────
export default function BookScreen() {
  const { t } = useI18n();
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: api.regions,
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ['providers', selectedDistrict],
    queryFn: () => api.providers(selectedDistrict ? { region: selectedDistrict } : {}),
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: api.wallet,
  });

  // Flatten all subregions for picker
  const subregions = useMemo(() => {
    const out = [{ name: '', label: t.allDistricts }];
    (regions || []).forEach((r) => {
      (r.subregions || []).forEach((s) => {
        out.push({ name: s.name, label: s.name });
      });
    });
    return out;
  }, [regions]);

  const filteredProviders = useMemo(() => {
    if (!selectedDistrict) return providers || [];
    return (providers || []).filter((p) =>
      p.region_name === selectedDistrict ||
      (p.regions_covered || []).includes(selectedDistrict)
    );
  }, [providers, selectedDistrict]);

  if (bookingSuccess) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <Text style={styles.successSubtitle}>
          Your appointment is pending acceptance from the specialist.
        </Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => setBookingSuccess(false)}>
          <Text style={styles.successBtnText}>Book Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 {t.findSpecialist}</Text>
      </View>

      {/* District picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.districtScroll}
        contentContainerStyle={styles.districtContent}
      >
        {subregions.map((r) => (
          <TouchableOpacity
            key={r.name}
            style={[styles.districtPill, selectedDistrict === r.name && styles.districtPillActive]}
            onPress={() => setSelectedDistrict(r.name)}
          >
            <Text style={[styles.districtText, selectedDistrict === r.name && styles.districtTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Provider list */}
      {isLoading ? (
        <View style={styles.center}><Text style={styles.loadingText}>Finding specialists…</Text></View>
      ) : filteredProviders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>{t.noProviders}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={() => setSelectedProvider(item)}
            />
          )}
        />
      )}

      {/* Provider profile sheet */}
      <ProviderSheet
        provider={selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onBook={(p) => {
          setSelectedProvider(null);
          setBookingProvider(p);
        }}
      />

      {/* 4-step booking modal */}
      {bookingProvider && (
        <BookingModal
          provider={bookingProvider}
          wallet={walletData}
          onClose={() => setBookingProvider(null)}
          onSuccess={() => {
            setBookingProvider(null);
            setBookingSuccess(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  districtScroll: { maxHeight: 48, marginBottom: 4 },
  districtContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  districtPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  districtPillActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  districtText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  districtTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: '#94a3b8', fontSize: 14 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  // Provider sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  closeBtn: { fontSize: 18, color: '#94a3b8', padding: 4 },
  sheetScroll: { flex: 1 },
  providerSheetHeader: { alignItems: 'center', padding: 24, paddingBottom: 16 },
  providerSheetAvatar: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  providerSheetInitials: { fontSize: 24, fontWeight: '800', color: '#0d9488' },
  providerSheetName: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  providerSheetSpec: { fontSize: 13, color: '#64748b', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingStars: { color: '#f59e0b', fontSize: 14 },
  ratingValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  ratingCount: { fontSize: 12, color: '#94a3b8' },
  priceRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10, marginBottom: 16 },
  priceBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  priceLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  priceValue: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  bioSection: { paddingHorizontal: 20, marginBottom: 16 },
  bioLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  bioText: { fontSize: 13, color: '#64748b', lineHeight: 20 },
  serviceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serviceChip: { backgroundColor: '#f0fdfa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#ccfbf1' },
  serviceChipText: { fontSize: 11, fontWeight: '600', color: '#0f766e' },
  sheetFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  bookBtn: { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Booking modal
  bookingSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  stepRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#0d9488' },
  stepDotDone: { backgroundColor: '#ccfbf1' },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 9, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' },
  stepLabelActive: { color: '#0d9488' },
  bookingBody: { flex: 1, paddingHorizontal: 20 },
  stepHeading: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  stepHint: { fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 18 },
  prescriptionInput: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#0f172a', minHeight: 120,
    backgroundColor: '#f8fafc',
  },
  dateScroll: { marginBottom: 4 },
  dateChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', marginRight: 8 },
  dateChipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  dateChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  dateChipTextActive: { color: '#fff' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 20 },
  timeChip: { width: '30%', paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  timeChipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  timeChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  timeChipTextActive: { color: '#fff' },
  pkgCard: { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgCardActive: { borderColor: '#0d9488', backgroundColor: '#f0fdfa' },
  pkgLeft: { flex: 1 },
  pkgLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  pkgLabelActive: { color: '#0d9488' },
  discountBadge: { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  discountText: { fontSize: 10, fontWeight: '700', color: '#15803d' },
  pkgRight: { alignItems: 'flex-end' },
  pkgOriginal: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  pkgPrice: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  pkgPriceActive: { color: '#0d9488' },
  promoRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  promoInput: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', fontWeight: '600' },
  promoInputSuccess: { borderColor: '#0d9488', backgroundColor: '#f0fdfa' },
  promoBtn: { backgroundColor: '#0d9488', borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  promoBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  summaryCard: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  summaryBold: { fontSize: 16, fontWeight: '800', color: '#0d9488' },
  summaryHighlight: { color: '#15803d' },
  summaryDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  walletCheck: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, marginBottom: 12 },
  walletOk: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  walletLow: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },
  walletCheckIcon: { fontSize: 24 },
  walletCheckLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  walletCheckAmt: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  insufficientText: { fontSize: 12, color: '#dc2626', textAlign: 'center', marginBottom: 8 },
  appointmentPreview: { backgroundColor: '#f0fdfa', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  appointmentPreviewText: { fontSize: 13, fontWeight: '600', color: '#0d9488' },
  bookingFooter: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  backBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  nextBtn: { flex: 1, backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  // Success screen
  successScreen: { flex: 1, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center', padding: 32 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  successBtn: { backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
