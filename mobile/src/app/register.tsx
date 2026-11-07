import {
  KeyboardAvoidingView,
  Platform,
  registerCallableModule,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { router } from 'expo-router'
import { useState } from 'react'

import { OutlineButton, PrimaryButton, Screen } from '../components'

import { useAuth } from '../auth/AuthContext'
import { colors } from '../theme'

type RegisterErrors = {
  name?: string
  email?: string
  businessName?: string
  password?: string
  form?: string
}

export default function Register() {
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')

  const [errors, setErrors] = useState<RegisterErrors>({})

  const [submitting, setSubmitting] = useState(false)

  function validateForm(): boolean {
    const newErrors: RegisterErrors = {}

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      newErrors.name = 'Please enter your name.'
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Your name must contain at least 2 characters.'
    }

    if (!trimmedEmail) {
      newErrors.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!password) {
      newErrors.password = 'Please enter a password.'
    } else if (password.length < 8) {
      newErrors.password = 'Password must contain at least 8 characters.'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  function clearFieldError(field: keyof RegisterErrors) {
    if (errors[field] || errors.form) {
      setErrors(current => ({
        ...current,
        [field]: undefined,
        form: undefined,
      }))
    }
  }

  async function handleRegister() {
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)

      setErrors({})

      await register(name.trim(), email.trim(), password, businessName.trim())

      router.replace('/home' as any)
    } catch (error) {
      console.error('Registration error:', error)

      let message = 'Unable to create your account. Please try again.'

      if (error instanceof Error) {
        message = error.message
      }

      setErrors({
        form: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen style={styles.registerPage}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>

          {errors.form ? (
            <View style={styles.formError}>
              <Text style={styles.formErrorText}>{errors.form}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Name</Text>

            <TextInput
              value={name}
              onChangeText={text => {
                setName(text)
                clearFieldError('name')
              }}
              placeholder="Enter your name"
              placeholderTextColor="#8A8A8A"
              autoCapitalize="words"
              style={[styles.input, errors.name && styles.inputError]}
              editable={!submitting}
            />

            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}

            <Text style={styles.label}>Email address</Text>

            <TextInput
              value={email}
              onChangeText={text => {
                setEmail(text)
                clearFieldError('email')
              }}
              placeholder="Enter your email"
              placeholderTextColor="#8A8A8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              style={[styles.input, errors.email && styles.inputError]}
              editable={!submitting}
            />

            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            <Text style={styles.label}>Password</Text>

            <TextInput
              value={password}
              onChangeText={text => {
                setPassword(text)
                clearFieldError('password')
              }}
              placeholder="Minimum 8 characters"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              autoComplete="new-password"
              style={[styles.input, errors.password && styles.inputError]}
              editable={!submitting}
            />

            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <View style={styles.buttonContainer}>
              <PrimaryButton
                label={submitting ? 'Creating account...' : 'Create account'}
                onPress={handleRegister}
                disabled={submitting}
              />

              <OutlineButton
                label="Already have an account? Login"
                onPress={() => router.push('/login' as any)}
              />
            </View>
          </View>
          <Text style={styles.footer}>
            Tailored toFit. Made for tailors, Designed for perfection.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  registerPage: {
    overflowY: 'auto',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },

  content: {
    marginTop: 30,
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },

  title: {
    color: '#010131',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },

  form: {
    gap: 8,
  },

  label: {
    color: '#010131',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },

  input: {
    height: 48,
    borderWidth: 0,
    borderColor: 'none',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
    color: '#010131',
    backgroundColor: '#dcdada',
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
  buttonContainer: {
    marginTop: 32,
    marginBottom: 20,
    gap: 10,
  },

  footer: {
    color: '#010131',
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
  },
})
