import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { router } from 'expo-router';
import { useState } from 'react';

import { Header, PrimaryButton, Screen } from '../components';
import { colors } from '../theme';
import { createClient } from '../api/clients';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
};

export default function AddClient() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | undefined>();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};

    // -------------------------
    // Client name
    // -------------------------

    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = 'Client name is required.';
    } else if (trimmedName.length < 2) {
      newErrors.name =
        'Client name must contain at least 2 characters.';
    }

    // -------------------------
    // Email - OPTIONAL
    // -------------------------

    const trimmedEmail = email.trim();

    if (trimmedEmail) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email =
          'Please enter a valid email address.';
      }
    }

    // -------------------------
    // Phone - OPTIONAL
    // -------------------------

    const trimmedPhone = phone.trim();

    if (trimmedPhone) {
      // Allows numbers, spaces, +, -, and brackets.
      const phoneRegex =
        /^[+\d\s()-]{7,20}$/;

      if (!phoneRegex.test(trimmedPhone)) {
        newErrors.phone =
          'Please enter a valid phone number.';
      }
    }

    // -------------------------
    // Date of birth - OPTIONAL
    // -------------------------

    const trimmedDate = dateOfBirth.trim();

    if (trimmedDate) {
      // Require YYYY-MM-DD format.
      const dateRegex =
        /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(trimmedDate)) {
        newErrors.dateOfBirth =
          'Use the format YYYY-MM-DD.';
      } else {
        const date = new Date(
          `${trimmedDate}T00:00:00`
        );

        if (Number.isNaN(date.getTime())) {
          newErrors.dateOfBirth =
            'Please enter a valid date.';
        } else {
          // Make sure JavaScript did not convert
          // an invalid date such as 2020-02-31.
          const [year, month, day] =
            trimmedDate.split('-').map(Number);

          if (
            date.getFullYear() !== year ||
            date.getMonth() + 1 !== month ||
            date.getDate() !== day
          ) {
            newErrors.dateOfBirth =
              'Please enter a valid date.';
          } else if (date > new Date()) {
            newErrors.dateOfBirth =
              'Date of birth cannot be in the future.';
          }
        }
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    // Prevent accidental double submission.
    if (submitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await createClient({
        name: name.trim(),
        gender,

        dateOfBirth: dateOfBirth.trim()
          ? new Date(
              `${dateOfBirth.trim()}T00:00:00`
            ).toISOString()
          : undefined,

        phone: phone.trim() || undefined,

        email: email.trim() || undefined,

        notes: notes.trim() || undefined,
      });

      // Navigate directly to the newly created client.
      router.replace(
        `/client/${response.client.id}` as any
      );
    } catch (error) {
      console.error(
        'Failed to create client:',
        error
      );

      Alert.alert(
        'Unable to add client',
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the client.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header title="Add Client" back />

          <Text style={styles.title}>
            Client Information
          </Text>

          <Text style={styles.subtitle}>
            Add your client's details before recording
            their measurements.
          </Text>

          {/* =========================
              CLIENT NAME
          ========================== */}

          <FieldLabel
            label="Client name"
            required
          />

          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);

              if (errors.name) {
                setErrors((current) => ({
                  ...current,
                  name: undefined,
                }));
              }
            }}
            placeholder="Enter client's full name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
            style={[
              styles.input,
              errors.name && styles.inputError,
            ]}
            editable={!submitting}
          />

          {errors.name ? (
            <Text style={styles.errorText}>
              {errors.name}
            </Text>
          ) : null}

          {/* =========================
              GENDER
          ========================== */}

          <FieldLabel label="Gender" />

          <View style={styles.genderRow}>
            <GenderButton
              label="Male"
              selected={gender === 'MALE'}
              onPress={() => {
                if (!submitting) {
                  setGender('MALE');
                }
              }}
            />

            <GenderButton
              label="Female"
              selected={gender === 'FEMALE'}
              onPress={() => {
                if (!submitting) {
                  setGender('FEMALE');
                }
              }}
            />

            <GenderButton
              label="Other"
              selected={gender === 'OTHER'}
              onPress={() => {
                if (!submitting) {
                  setGender('OTHER');
                }
              }}
            />
          </View>

          {/* =========================
              DATE OF BIRTH
              OPTIONAL
          ========================== */}

          <FieldLabel label="Date of birth" />

          <TextInput
            value={dateOfBirth}
            onChangeText={(text) => {
              setDateOfBirth(text);

              if (errors.dateOfBirth) {
                setErrors((current) => ({
                  ...current,
                  dateOfBirth: undefined,
                }));
              }
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={[
              styles.input,
              errors.dateOfBirth &&
                styles.inputError,
            ]}
            editable={!submitting}
          />

          <Text style={styles.helper}>
            Optional · Example: 1995-06-24
          </Text>

          {errors.dateOfBirth ? (
            <Text style={styles.errorText}>
              {errors.dateOfBirth}
            </Text>
          ) : null}

          {/* =========================
              PHONE
              OPTIONAL
          ========================== */}

          <FieldLabel label="Phone number" />

          <TextInput
            value={phone}
            onChangeText={(text) => {
              setPhone(text);

              if (errors.phone) {
                setErrors((current) => ({
                  ...current,
                  phone: undefined,
                }));
              }
            }}
            placeholder="Enter phone number"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={[
              styles.input,
              errors.phone && styles.inputError,
            ]}
            editable={!submitting}
          />

          <Text style={styles.helper}>
            Optional
          </Text>

          {errors.phone ? (
            <Text style={styles.errorText}>
              {errors.phone}
            </Text>
          ) : null}

          {/* =========================
              EMAIL
              OPTIONAL
          ========================== */}

          <FieldLabel label="Email address" />

          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);

              if (errors.email) {
                setErrors((current) => ({
                  ...current,
                  email: undefined,
                }));
              }
            }}
            placeholder="Enter email address"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              errors.email && styles.inputError,
            ]}
            editable={!submitting}
          />

          <Text style={styles.helper}>
            Optional
          </Text>

          {errors.email ? (
            <Text style={styles.errorText}>
              {errors.email}
            </Text>
          ) : null}

          {/* =========================
              NOTES
              OPTIONAL
          ========================== */}

          <FieldLabel label="Notes" />

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional information about this client..."
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.notesInput,
            ]}
            editable={!submitting}
          />

          <Text style={styles.helper}>
            Optional
          </Text>

          {/* =========================
              SAVE BUTTON
          ========================== */}

          <View style={styles.buttonContainer}>
            <PrimaryButton
              label={
                submitting
                  ? 'Saving client...'
                  : 'Save Client'
              }
              onPress={handleSave}
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.label}>
      {label}

      {required ? (
        <Text style={styles.required}>
          {' '}*
        </Text>
      ) : null}
    </Text>
  );
}

function GenderButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.genderButton,
        selected &&
          styles.genderButtonSelected,
      ]}
    >
      <Text
        style={[
          styles.genderText,
          selected &&
            styles.genderTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 8,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    marginTop: 5,
    marginBottom: 20,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 12,
  },

  required: {
    color: '#A42828',
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },

  inputError: {
    borderColor: '#C84A4A',
  },

  errorText: {
    color: '#A42828',
    fontSize: 12,
    marginTop: 4,
  },

  helper: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },

  genderButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  genderButtonSelected: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },

  genderText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  genderTextSelected: {
    color: '#fff',
  },

  notesInput: {
    height: 90,
    paddingTop: 12,
  },

  buttonContainer: {
    marginTop: 25,
  },
});