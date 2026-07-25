import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProviderCard({ provider, onPress }) {
  const initials = (provider.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.spec} numberOfLines={1}>{provider.specialty || provider.type}</Text>
        <View style={styles.meta}>
          {provider.rating != null && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>⭐ {Number(provider.rating).toFixed(1)}</Text>
            </View>
          )}
          {provider.region_name && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>📍 {provider.region_name}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{provider.price_per_session}</Text>
        <Text style={styles.priceLabel}>EGP / session</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 16, fontWeight: '800', color: '#0d9488' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  spec: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: {
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  chipText: { fontSize: 10, fontWeight: '600', color: '#0f766e' },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '800', color: '#0d9488' },
  priceLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});
