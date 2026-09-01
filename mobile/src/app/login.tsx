import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useState } from 'react';

import {
  Screen,
  PrimaryButton,
  OutlineButton,
} from '../components';

import { colors } from '../theme';
import { useAuth } from '../auth/AuthContext';

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] =
    useState<LoginErrors>({});

  const [submitting, setSubmitting] =
    useState(false);

  function validateForm(): boolean {
    const newErrors: LoginErrors = {};

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email =
        'Please enter your email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedEmail
      )
    ) {
      newErrors.email =
        'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password =
        'Please enter your password.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleEmailChange(text: string) {
    setEmail(text);

    if (errors.email || errors.form) {
      setErrors((current) => ({
        ...current,
        email: undefined,
        form: undefined,
      }));
    }
  }

  function handlePasswordChange(text: string) {
    setPassword(text);

    if (errors.password || errors.form) {
      setErrors((current) => ({
        ...current,
        password: undefined,
        form: undefined,
      }));
    }
  }

  async function handleLogin() {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      setErrors({});

      await login(
        email.trim(),
        password
      );

      router.replace('/home' as any);
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      let message =
        'Unable to log in. Please try again.';

      if (error instanceof Error) {
        message = error.message;
      }

      setErrors({
        form: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen dark>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.content}>
          <Text style={styles.logo}>
            Tailored{' '}
            <Text style={styles.gold}>
              toFit
            </Text>
          </Text>

          <Text style={styles.title}>
            Welcome back
          </Text>

          <Text style={styles.subtitle}>
            Sign in to continue to your
            tailoring studio.
          </Text>

          {errors.form ? (
            <View style={styles.formError}>
              <Text
                style={styles.formErrorText}
              >
                {errors.form}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>
              Email address
            </Text>

            <TextInput
              value={email}
              onChangeText={
                handleEmailChange
              }
              placeholder="Enter your email"
              placeholderTextColor="#8A8A8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              style={[
                styles.input,
                errors.email &&
                  styles.inputError,
              ]}
              editable={!submitting}
            />

            {errors.email ? (
              <Text style={styles.errorText}>
                {errors.email}
              </Text>
            ) : null}

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              value={password}
              onChangeText={
                handlePasswordChange
              }
              placeholder="Enter your password"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              autoComplete="password"
              style={[
                styles.input,
                errors.password &&
                  styles.inputError,
              ]}
              editable={!submitting}
            />

            {errors.password ? (
              <Text style={styles.errorText}>
                {errors.password}
              </Text>
            ) : null}

            <PrimaryButton
              label={
                submitting
                  ? 'Signing in...'
                  : 'Login'
              }
              onPress={handleLogin}
              disabled={submitting}
            />

            <OutlineButton
              label="Create an account"
              onPress={() =>
                router.push(
                  '/register' as any
                )
              }
            />
          </View>
        </View>

        <Text style={styles.footer}>
          Made for tailors. Designed for
          perfection.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },

  content: {
    marginTop: 60,
  },

  logo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'serif',
    marginBottom: 50,
  },

  gold: {
    color: colors.gold,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },

  subtitle: {
    color: '#B8B8B8',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 25,
  },

  form: {
    gap: 8,
  },

  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 16,
    color: '#fff',
    backgroundColor: '#171717',
    fontSize: 15,
  },

  inputError: {
    borderColor: '#E05252',
  },

  errorText: {
    color: '#FF7B7B',
    fontSize: 11,
    marginTop: -3,
    marginBottom: 2,
  },

  formError: {
    backgroundColor: '#3A1E1E',
    borderWidth: 1,
    borderColor: '#7A3535',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 12,
  },

  formErrorText: {
    color: '#FF9A9A',
    fontSize: 12,
    lineHeight: 18,
  },

  footer: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 10,
  },
});