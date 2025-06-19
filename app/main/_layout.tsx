import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../Src/FireBase/FireBase';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';

export default function MainLayout() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const auth = getAuth(app);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace('/tabs/login');
      }
      setChecking(false);
    });

    return unsubscribe;
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Verificando autenticação nas tabs...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="Principal" />
      <Tabs.Screen name="explore" />
    </Tabs>
  );
}

