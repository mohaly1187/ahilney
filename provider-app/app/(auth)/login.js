import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n';

export default function LoginScreen() {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      await login(data.token, {
        id: data.provider_id,
        name: data.name,
        email: email.trim(),
        ...data,
      });
    } catch (err) {
      Alert.alert('Login Failed', err.message || t.invalidCredentials);
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
            <Text style={styles.logoIcon}>🩺</Text>
          </View>
          <Text style={styles.brand}>Ahilney</Text>
          <Text style={styles.tagline}>Provider Portal</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>{t.providerLogin}</Text>

          <TextInput
            style={styles.input}
            placeholder={t.emailPlaceholder}
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder={t.passwordPlaceholder}
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? t.signingIn : t.signIn}</Text>
          </TouchableOpacity>
        </View>

        {/* Dev hint */}
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Dev credentials</Text>
          <Text style={styles.hintText}>amira.k@ahilney.com · password123</Text>
          <Text style={styles.hintText}>karim.a@ahilney.com · password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdfa' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#0d9488',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#0d9488', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  logoIcon: { fontSize: 32 },
  brand: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#64748b', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  heading: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#0f172a',
    backgroundColor: '#f8fafc', marginBottom: 12,
  },
  btn: {
    backgroundColor: '#0d9488', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hintBox: {
    marginTop: 24, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  hintTitle: { fontSize: 10, fontWeight: '700', color: '#0d9488', textTransform: 'uppercase', marginBottom: 4 },
  hintText: { fontSize: 11, color: '#64748b', lineHeight: 18 },
});
