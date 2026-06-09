import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import supabase from '../config/supabaseClient';
import { useApp } from '../context/AppContext';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { dispatch } = useApp();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // Sign out any existing session
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.collegecsroadmap://auth-callback',
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        Alert.alert('Sign In Error', error.message);
        return;
      }

      // User is now authenticated
      if (data?.user) {
        dispatch({ type: 'SET_USER', user: data.user });
        // Navigate to DecisionTree
        navigation.replace('DecisionTree');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    // For demo purposes, use anonymous authentication
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        Alert.alert('Sign In Error', error.message);
        return;
      }

      if (data?.user) {
        dispatch({ type: 'SET_USER', user: data.user });
        navigation.replace('DecisionTree');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>CS Interview Roadmap</Text>
          <Text style={styles.subtitle}>
            Get your personalized study plan for landing your dream tech job
          </Text>
        </View>

        <View style={styles.features}>
          <Text style={styles.featureTitle}>What You'll Get:</Text>
          <Text style={styles.feature}>✓ Personalized learning path</Text>
          <Text style={styles.feature}>✓ Week-by-week study schedule</Text>
          <Text style={styles.feature}>✓ Progress tracking</Text>
          <Text style={styles.feature}>✓ Real-time sync across devices</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign in with Google</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleEmailSignIn}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          By signing in, you agree to our Terms of Service
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  features: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: '#333',
    lineHeight: 24,
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
