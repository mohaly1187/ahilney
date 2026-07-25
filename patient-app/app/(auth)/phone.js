import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';

export default function PhoneScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      Alert.alert('', t.phoneRequired);
      return;
    }
    setLoading(true);
    try {
      await api.sendOtp(trimmed);
      router.push({ pathname: '/(auth)/otp', params: { phone: trimmed } });
    } catch (err) {
      Alert.alert('Error', err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>💙</Text>
          </View>
          <Text style={styles.brand}>Ahilney</Text>
          <Text style={styles.tagline}>Home Physiotherapy Care</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>{t.enterPhone}</Text>
          <Text style={styles.hint}>{t.phoneHint}</Text>

          <TextInput
            style={styles.input}
            placeholder={t.phonePlaceholder}
            placeholderTextColor="#94a3b8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? t.sending : t.sendCode}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdfa' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, shadowColor: '#0d9488', shadowOpacity: 0.4,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  logoIcon: { fontSize: 32 },
  brand: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#64748b', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  heading: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 18 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#0f172a',
    backgroundColor: '#f8fafc', marginBottom: 16,
  },
  btn: {
    backgroundColor: '#0d9488', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 32, lineHeight: 16 },
});
