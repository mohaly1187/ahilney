import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useI18n } from '../../src/i18n';

function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useI18n();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications,
    refetchInterval: 30_000,
  });

  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.appointments(),
    refetchInterval: 30_000,
  });

  const unreadNotifs = (notifications || []).filter((n) => !n.is_read).length;
  const pendingCount = (appointments || []).filter(
    (a) => a.status === 'Pending RS Acceptance'
  ).length;
  const homeBadge = unreadNotifs + pendingCount;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          tabBarBadge: homeBadge > 0 ? homeBadge : undefined,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t.schedule,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: t.patients,
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t.wallet,
          tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8 },
  tabIconFocused: { backgroundColor: '#f0fdfa' },
  tabEmoji: { fontSize: 18 },
});
