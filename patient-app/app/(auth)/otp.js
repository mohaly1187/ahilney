import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';

export default function OtpScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('', t.codeRequired);
      return;
    }
    setLoading(true);
    try {
      const data = await api.verifyOtp(phone, code.trim());
      // data: { token, patient_id, name, ... }
      await login(data.token, {
        id: data.patient_id,
        name: data.name,
        phone,
        ...data,
      });
      // AuthGuard in _layout.js will redirect to (tabs)
    } catch (err) {
      Alert.alert('Error', err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.sendOtp(phone);
      Alert.alert('', `Code resent to ${phone}`);
    } catch (err) {
      Alert.alert('Error', err.message || t.error);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← {t.changeNumber}</Text>
        </TouchableOpacity>

        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🔐</Text>
          </View>
        </View>

        <Text style={styles.heading}>{t.verifyCode}</Text>
        <Text style={styles.hint}>
          {t.otpSentTo}{'\n'}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder={t.otpPlaceholder}
          placeholderTextColor="#94a3b8"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleVerify}
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{loading ? t.verifying : t.verify}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.resendText}>{resending ? 'Sending…' : t.resend}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdfa' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  back: { position: 'absolute', top: 56, left: 24 },
  backText: { color: '#0d9488', fontSize: 14, fontWeight: '600' },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center',
  },
  logoIcon: { fontSize: 28 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  hint: { fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 20 },
  phoneHighlight: { color: '#0d9488', fontWeight: '700' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 16, fontSize: 24, color: '#0f172a',
    backgroundColor: '#fff', marginBottom: 16,
    textAlign: 'center', letterSpacing: 8,
  },
  btn: {
    backgroundColor: '#0d9488', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn: { alignItems: 'center', padding: 8 },
  resendText: { color: '#0d9488', fontSize: 14, fontWeight: '600' },
});
