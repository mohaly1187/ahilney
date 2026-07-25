import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_MAP = {
  'Pending RS Acceptance': { label: 'Pending', bg: '#fef3c7', text: '#d97706' },
  'Confirmed': { label: 'Confirmed', bg: '#dcfce7', text: '#15803d' },
  'In Progress': { label: 'In Progress', bg: '#dbeafe', text: '#1d4ed8' },
  'Session Summary Submitted': { label: 'Summary Submitted', bg: '#ede9fe', text: '#6d28d9' },
  'Finished': { label: 'Finished', bg: '#f0fdf4', text: '#166534' },
  'Rejected': { label: 'Rejected', bg: '#fee2e2', text: '#b91c1c' },
  'Cancelled': { label: 'Cancelled', bg: '#f1f5f9', text: '#475569' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_MAP[status] || { label: status, bg: '#f1f5f9', text: '#475569' };
  return (
    <View style={[styles.pill, { backgroundColor: config.bg }, size === 'lg' && styles.lg]}>
      <Text style={[styles.text, { color: config.text }, size === 'lg' && styles.lgText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lg: { paddingHorizontal: 12, paddingVertical: 5 },
  lgText: { fontSize: 12 },
});
