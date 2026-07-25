import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from './StatusBadge';

export default function AppointmentCard({ appointment, onRate, onBookAgain, compact = false }) {
  const apt = appointment;
  const canRate = apt.status === 'Finished' && !apt.patient_rating;
  const wasRejected = apt.status === 'Rejected';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>{apt.type === 'Home Visit' ? '🏠' : '💻'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.providerName} numberOfLines={1}>
            {apt.provider_name || 'Provider'}
          </Text>
          <Text style={styles.meta}>{apt.type} · {apt.scheduled_time || apt.scheduled_date}</Text>
          {apt.service_name && (
            <Text style={styles.service} numberOfLines={1}>{apt.service_name}</Text>
          )}
        </View>
        <View style={styles.right}>
          <StatusBadge status={apt.status} />
          <Text style={styles.price}>{apt.price} EGP</Text>
        </View>
      </View>

      {!compact && (canRate || wasRejected) && (
        <View style={styles.actions}>
          {canRate && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onRate && onRate(apt)}>
              <Text style={styles.actionBtnText}>⭐ Rate Session</Text>
            </TouchableOpacity>
          )}
          {wasRejected && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.outlineBtn]}
              onPress={() => onBookAgain && onBookAgain(apt)}
            >
              <Text style={[styles.actionBtnText, styles.outlineBtnText]}>🔄 Book Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!compact && apt.patient_rating && (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>
            {'⭐'.repeat(apt.patient_rating)} Your rating
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  providerName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  meta: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  service: { fontSize: 11, color: '#0d9488', fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 12, fontWeight: '700', color: '#0d9488', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  outlineBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#0d9488' },
  outlineBtnText: { color: '#0d9488' },
  ratingRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  ratingText: { fontSize: 11, color: '#64748b' },
});
