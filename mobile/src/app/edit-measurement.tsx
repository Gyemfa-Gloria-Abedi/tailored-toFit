import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Header, Screen } from '../components';
import { colors } from '../theme';
import {
  getClient,
  updateMeasurement,
  type Measurement,
  type CreateMeasurementData,
} from '../api/clients';

const fields = [
  { key: 'neck', label: 'Neck' },
  { key: 'shoulderWidth', label: 'Shoulder Width' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'backLength', label: 'Back Length' },
  { key: 'acrossChest', label: 'Across Chest' },
  { key: 'sleeveLength', label: 'Sleeve Length' },
  { key: 'bicep', label: 'Bicep' },
  { key: 'wrist', label: 'Wrist' },
] as const;

type MeasurementKey = (typeof fields)[number]['key'];

export default function EditMeasurement() {
  const { id, clientId } = useLocalSearchParams<{
    id?: string;
    clientId?: string;
  }>();

  const [measurement, setMeasurement] =
    useState<Measurement | null>(null);

  const [unit, setUnit] = useState<'INCH' | 'CM'>('INCH');

  const [values, setValues] = useState<
    Record<MeasurementKey, string>
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMeasurement();
  }, [id, clientId]);

  async function loadMeasurement() {
    try {
      setLoading(true);

      if (!id) {
        throw new Error('Measurement ID is missing.');
      }

      /*
       * We load the client because the client endpoint already
       * returns its measurements.
       */
      if (!clientId) {
        throw new Error('Client ID is missing.');
      }

      const response = await getClient(clientId);

      const found = response.client.measurements?.find(
        item => item.id === id
      );

      if (!found) {
        throw new Error('Measurement not found.');
      }

      setMeasurement(found);
      setUnit(found.unit);

      setValues({
        neck: found.neck?.toString() ?? '',
        shoulderWidth: found.shoulderWidth?.toString() ?? '',
        chest: found.chest?.toString() ?? '',
        waist: found.waist?.toString() ?? '',
        hip: found.hip?.toString() ?? '',
        backLength: found.backLength?.toString() ?? '',
        acrossChest: found.acrossChest?.toString() ?? '',
        sleeveLength: found.sleeveLength?.toString() ?? '',
        bicep: found.bicep?.toString() ?? '',
        wrist: found.wrist?.toString() ?? '',
      });
    } catch (error) {
      Alert.alert(
        'Unable to load measurement',
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );

      router.back();
    } finally {
      setLoading(false);
    }
  }

  function updateValue(
    key: MeasurementKey,
    value: string
  ) {
    // Allow only numbers and one decimal point.
    const cleaned = value.replace(/[^0-9.]/g, '');

    const parts = cleaned.split('.');

    const formatted =
      parts.length > 2
        ? `${parts[0]}.${parts.slice(1).join('')}`
        : cleaned;

    setValues(previous => ({
      ...previous,
      [key]: formatted,
    }));
  }

  async function handleSave() {
    if (!measurement) return;

    for (const field of fields) {
      const value = Number(values[field.key]);

      if (!values[field.key].trim()) {
        Alert.alert(
          'Missing measurement',
          `Please enter the ${field.label.toLowerCase()}.`
        );
        return;
      }

      if (!Number.isFinite(value) || value <= 0) {
        Alert.alert(
          'Invalid measurement',
          `${field.label} must be greater than 0.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const data: CreateMeasurementData = {
        unit,
        neck: Number(values.neck),
        shoulderWidth: Number(values.shoulderWidth),
        chest: Number(values.chest),
        waist: Number(values.waist),
        hip: Number(values.hip),
        backLength: Number(values.backLength),
        acrossChest: Number(values.acrossChest),
        sleeveLength: Number(values.sleeveLength),
        bicep: Number(values.bicep),
        wrist: Number(values.wrist),
      };

      await updateMeasurement(
        measurement.id,
        data
      );

      router.replace(
        `/client/${measurement.clientId}` as any
      );
    } catch (error) {
      Alert.alert(
        'Unable to save',
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving the measurement.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Loading measurement...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Header
          title="Edit Measurement"
          back
        />

        <Text style={styles.title}>
          Update Measurements
        </Text>

        <Text style={styles.sub}>
          Update the client's measurements below.
        </Text>

        {/* Unit selector */}
        <Text style={styles.sectionLabel}>
          Measurement Unit
        </Text>

        <View style={styles.unitRow}>
          <Pressable
            disabled={saving}
            style={[
              styles.unitButton,
              unit === 'INCH' &&
                styles.unitButtonActive,
            ]}
            onPress={() => setUnit('INCH')}
          >
            <Text
              style={[
                styles.unitText,
                unit === 'INCH' &&
                  styles.unitTextActive,
              ]}
            >
              Inches
            </Text>
          </Pressable>

          <Pressable
            disabled={saving}
            style={[
              styles.unitButton,
              unit === 'CM' &&
                styles.unitButtonActive,
            ]}
            onPress={() => setUnit('CM')}
          >
            <Text
              style={[
                styles.unitText,
                unit === 'CM' &&
                  styles.unitTextActive,
              ]}
            >
              Centimetres
            </Text>
          </Pressable>
        </View>

        {/* Measurements */}
        <View style={styles.measurements}>
          {fields.map(field => (
            <View
              key={field.key}
              style={styles.row}
            >
              <Text style={styles.label}>
                {field.label}
              </Text>

              <View style={styles.inputWrap}>
                <TextInput
                  value={values[field.key]}
                  onChangeText={value =>
                    updateValue(
                      field.key,
                      value
                    )
                  }
                  keyboardType="decimal-pad"
                  editable={!saving}
                  placeholder="0"
                  placeholderTextColor={
                    colors.muted
                  }
                  style={styles.value}
                />

                <Text style={styles.unit}>
                  {unit === 'INCH'
                    ? 'in'
                    : 'cm'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Save */}
        <Pressable
          disabled={saving}
          onPress={handleSave}
          style={[
            styles.saveButton,
            saving &&
              styles.saveButtonDisabled,
          ]}
        >
          {saving ? (
            <View style={styles.savingContent}>
              <ActivityIndicator
                size="small"
                color="#fff"
              />
              <Text style={styles.saveText}>
                Saving...
              </Text>
            </View>
          ) : (
            <Text style={styles.saveText}>
              Save Changes
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  loadingText: {
    fontSize: 12,
    color: colors.muted,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },

  sub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 18,
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
    marginBottom: 18,
  },

  unitButton: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  unitButtonActive: {
    backgroundColor: colors.primary,
  },

  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  unitTextActive: {
    color: '#fff',
  },

  measurements: {
    marginBottom: 20,
  },

  row: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  label: {
    fontSize: 11,
    color: colors.text,
  },

  inputWrap: {
    height: 34,
    width: 82,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    paddingHorizontal: 6,
    borderWidth: 0,
    outlineWidth: 0,
  },

  unit: {
    fontSize: 9,
    color: colors.muted,
    paddingRight: 8,
  },

  saveButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },

  savingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});