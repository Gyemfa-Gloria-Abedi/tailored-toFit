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

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { useState } from 'react';

import {
  Header,
  PrimaryButton,
  Screen,
} from '../components';

import { colors } from '../theme';

import {
  createMeasurement,
  CreateMeasurementData,
} from '../api/clients';

type Unit = 'INCH' | 'CM';

type MeasurementField =
  | 'neck'
  | 'shoulderWidth'
  | 'chest'
  | 'waist'
  | 'hip'
  | 'backLength'
  | 'acrossChest'
  | 'sleeveLength'
  | 'bicep'
  | 'wrist';

type Errors = Partial<
  Record<MeasurementField, string>
>;

const fields: {
  key: MeasurementField;
  label: string;
}[] = [
  {
    key: 'neck',
    label: 'Neck',
  },
  {
    key: 'shoulderWidth',
    label: 'Shoulder Width',
  },
  {
    key: 'chest',
    label: 'Chest',
  },
  {
    key: 'waist',
    label: 'Waist',
  },
  {
    key: 'hip',
    label: 'Hip',
  },
  {
    key: 'backLength',
    label: 'Back Length',
  },
  {
    key: 'acrossChest',
    label: 'Across Chest',
  },
  {
    key: 'sleeveLength',
    label: 'Sleeve Length',
  },
  {
    key: 'bicep',
    label: 'Bicep',
  },
  {
    key: 'wrist',
    label: 'Wrist',
  },
];

export default function NewMeasurement() {
  const { clientId } =
    useLocalSearchParams<{
      clientId: string;
    }>();

  const [unit, setUnit] =
    useState<Unit>('INCH');

  const [values, setValues] =
    useState<
      Record<MeasurementField, string>
    >({
      neck: '',
      shoulderWidth: '',
      chest: '',
      waist: '',
      hip: '',
      backLength: '',
      acrossChest: '',
      sleeveLength: '',
      bicep: '',
      wrist: '',
    });

  const [errors, setErrors] =
    useState<Errors>({});

  const [submitting, setSubmitting] =
    useState(false);

  function updateValue(
  field: MeasurementField,
  value: string
) {
  const cleaned = value.replace(/[^0-9.]/g, '');

  const parts = cleaned.split('.');

  const formatted =
    parts.length > 2
      ? `${parts[0]}.${parts.slice(1).join('')}`
      : cleaned;

  setValues((current) => ({
    ...current,
    [field]: formatted,
  }));

  if (errors[field]) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }
}

  function validate() {
    const newErrors: Errors = {};

    fields.forEach(({ key, label }) => {
      const value = values[key].trim();

      if (!value) {
        newErrors[key] =
          `${label} is required.`;
        return;
      }

      const number = Number(value);

      if (Number.isNaN(number)) {
        newErrors[key] =
          `${label} must be a number.`;
        return;
      }

      if (number <= 0) {
        newErrors[key] =
          `${label} must be greater than 0.`;
      }
    });

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  async function handleSave() {
    if (submitting) {
      return;
    }

    if (!clientId) {
      Alert.alert(
        'Client not found',
        'This measurement is not linked to a client.'
      );
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      const data: CreateMeasurementData = {
        unit,

        neck: Number(values.neck),
        shoulderWidth:
          Number(values.shoulderWidth),
        chest: Number(values.chest),
        waist: Number(values.waist),
        hip: Number(values.hip),
        backLength:
          Number(values.backLength),
        acrossChest:
          Number(values.acrossChest),
        sleeveLength:
          Number(values.sleeveLength),
        bicep: Number(values.bicep),
        wrist: Number(values.wrist),
      };

      await createMeasurement(
        clientId,
        data
      );

      router.replace(
        `/client/${clientId}` as any
      );
    } catch (error) {
      console.error(
        'Failed to save measurements:',
        error
      );

      Alert.alert(
        'Unable to save measurements',
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the measurements.'
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
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Header
            title="New Measurement"
            back
          />

          <Text style={styles.title}>
            Client Measurements
          </Text>

          <Text style={styles.sub}>
            Capture accurate measurements for
            AI fit analysis.
          </Text>

          {/* Unit selector */}

          <Text style={styles.sectionLabel}>
            Measurement unit
          </Text>

          <View style={styles.unitRow}>
            <UnitButton
              label="Inches (in)"
              selected={unit === 'INCH'}
              onPress={() => {
                if (!submitting) {
                  setUnit('INCH');
                }
              }}
            />

            <UnitButton
              label="Centimetres (cm)"
              selected={unit === 'CM'}
              onPress={() => {
                if (!submitting) {
                  setUnit('CM');
                }
              }}
            />
          </View>

          {/* Measurements */}

          {fields.map(({ key, label }) => (
            <View
              key={key}
              style={styles.field}
            >
              <Text style={styles.label}>
                {label}
              </Text>

              <View
                style={[
                  styles.inputWrap,
                  errors[key] &&
                    styles.inputError,
                ]}
              >
                <TextInput
                  value={values[key]}
                  onChangeText={(value) =>
                    updateValue(
                      key,
                      value
                    )
                  }
                  placeholder="0.00"
                  placeholderTextColor={
                    colors.muted
                  }
                  keyboardType="decimal-pad"
                  style={styles.value}
                  editable={!submitting}
                />

                <Text style={styles.unit}>
                  {unit === 'INCH'
                    ? 'in'
                    : 'cm'}
                </Text>
              </View>

              {errors[key] ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {errors[key]}
                </Text>
              ) : null}
            </View>
          ))}

          <View
            style={styles.buttonContainer}
          >
            <PrimaryButton
              label={
                submitting
                  ? 'Saving measurements...'
                  : 'Save Measurements'
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

function UnitButton({
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
        styles.unitButton,
        selected &&
          styles.unitButtonSelected,
      ]}
    >
      <Text
        style={[
          styles.unitButtonText,
          selected &&
            styles.unitButtonTextSelected,
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
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  sub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 15,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },

  /* -------------------------
     UNIT SELECTOR
  ------------------------- */

  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },

  unitButton: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    backgroundColor: '#F7F5FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  unitButtonSelected: {
    backgroundColor: colors.purple,
  },

  unitButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },

  unitButtonTextSelected: {
    color: '#fff',
  },

  /* -------------------------
     MEASUREMENT FIELD
  ------------------------- */

  field: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: colors.line,

    paddingVertical: 7,
  },

  label: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    paddingRight: 16,
  },

  /* -------------------------
     INPUT
  ------------------------- */

  inputWrap: {
    width: 105,
    height: 38,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F7F5FA',
    borderRadius: 9,

    paddingLeft: 10,
    paddingRight: 10,
  },

  inputError: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#C84A4A',
  },

  value: {
    flex: 1,
    minWidth: 0,
    height: 38,

    textAlign: 'right',

    fontSize: 13,
    fontWeight: '600',
    color: colors.text,

    paddingVertical: 0,
    paddingHorizontal: 0,

    borderWidth: 0,
    outlineWidth: 0,
  },

  unit: {
    width: 22,

    marginLeft: 7,

    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,

    textAlign: 'left',
  },

  /* -------------------------
     VALIDATION
  ------------------------- */

  errorText: {
    color: '#A42828',
    fontSize: 9,
    marginTop: 4,
    marginLeft: 2,
  },

  /* -------------------------
     SAVE BUTTON
  ------------------------- */

  buttonContainer: {
    marginTop: 22,
  },
});