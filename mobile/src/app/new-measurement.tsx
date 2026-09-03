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
    // Only allow numbers and decimal points.
    const cleaned = value.replace(
      /[^0-9.]/g,
      ''
    );

    setValues((current) => ({
      ...current,
      [field]: cleaned,
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
    marginBottom: 18,
    lineHeight: 15,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },

  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },

  unitButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  unitButtonSelected: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },

  unitButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
  },

  unitButtonTextSelected: {
    color: '#fff',
  },

  field: {
    marginBottom: 10,
  },

  label: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 5,
  },

  inputWrap: {
    height: 42,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputError: {
    borderColor: '#C84A4A',
  },

  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: colors.text,
    paddingHorizontal: 10,
    borderColor:'none',
    borderWidth: 0,
    outlineWidth: 0,
  },

  unit: {
    fontSize: 10,
    color: colors.muted,
    paddingRight: 10,
  },

  errorText: {
    color: '#A42828',
    fontSize: 9,
    marginTop: 3,
  },

  buttonContainer: {
    marginTop: 18,
  },
});