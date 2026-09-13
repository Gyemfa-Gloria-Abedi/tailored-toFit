import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Header, PrimaryButton, Screen } from '../components'
import { colors } from '../theme'

import {
  getMeasurement,
  updateMeasurement,
  type CreateMeasurementData,
  type Measurement,
} from '../api/clients'

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
] as const

type MeasurementKey = (typeof fields)[number]['key']

export default function EditMeasurement() {
  const { id, clientId } = useLocalSearchParams<{
    id?: string
    clientId?: string
  }>()

  const [measurement, setMeasurement] = useState<Measurement | null>(null)

  const [unit, setUnit] = useState<'INCH' | 'CM'>('INCH')

  const [values, setValues] = useState<Record<MeasurementKey, string>>({
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
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      loadMeasurement()
    }
  }, [id])

  async function loadMeasurement() {
    try {
      if (!id) {
        throw new Error('Measurement ID is missing.')
      }

      setLoading(true)

      const response = await getMeasurement(id)

      console.log('EDIT MEASUREMENT:', response.measurement)

      const existingMeasurement = response.measurement

      setMeasurement(existingMeasurement)

      setUnit(existingMeasurement.unit)

      setValues({
        neck:
          existingMeasurement.neck != null
            ? String(existingMeasurement.neck)
            : '',

        shoulderWidth:
          existingMeasurement.shoulderWidth != null
            ? String(existingMeasurement.shoulderWidth)
            : '',

        chest:
          existingMeasurement.chest != null
            ? String(existingMeasurement.chest)
            : '',

        waist:
          existingMeasurement.waist != null
            ? String(existingMeasurement.waist)
            : '',

        hip:
          existingMeasurement.hip != null
            ? String(existingMeasurement.hip)
            : '',

        backLength:
          existingMeasurement.backLength != null
            ? String(existingMeasurement.backLength)
            : '',

        acrossChest:
          existingMeasurement.acrossChest != null
            ? String(existingMeasurement.acrossChest)
            : '',

        sleeveLength:
          existingMeasurement.sleeveLength != null
            ? String(existingMeasurement.sleeveLength)
            : '',

        bicep:
          existingMeasurement.bicep != null
            ? String(existingMeasurement.bicep)
            : '',

        wrist:
          existingMeasurement.wrist != null
            ? String(existingMeasurement.wrist)
            : '',
      })
    } catch (error) {
      console.error('LOAD MEASUREMENT ERROR:', error)

      Alert.alert(
        'Unable to load measurement',
        error instanceof Error ? error.message : 'Something went wrong.',
      )

      router.back()
    } finally {
      setLoading(false)
    }
  }

  function updateValue(key: MeasurementKey, value: string) {
    const cleaned = value.replace(/[^0-9.]/g, '')

    const parts = cleaned.split('.')

    const formatted =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned

    setValues(previous => ({
      ...previous,
      [key]: formatted,
    }))
  }

  async function handleSave() {
    if (!measurement) return

    for (const field of fields) {
      const value = Number(values[field.key])

      if (!values[field.key].trim()) {
        Alert.alert(
          'Missing measurement',
          `Please enter the ${field.label.toLowerCase()}.`,
        )
        return
      }

      if (!Number.isFinite(value) || value <= 0) {
        Alert.alert(
          'Invalid measurement',
          `${field.label} must be greater than 0.`,
        )
        return
      }
    }

    try {
      setSaving(true)

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
      }

      await updateMeasurement(measurement.id, data)

      router.replace(`/client/${measurement.clientId}` as any)
    } catch (error) {
      Alert.alert(
        'Unable to save',
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={styles.loadingText}>Loading measurement...</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Header title="Edit Measurement" back />

        <Text style={styles.title}>Client Measurements</Text>

        <Text style={styles.sub}>Update the client's measurements below.</Text>

        {/* Unit selector */}
        <Text style={styles.sectionLabel}>Measurement Unit</Text>

        <View style={styles.unitRow}>
          <Pressable
            disabled={saving}
            onPress={() => setUnit('INCH')}
            style={[
              styles.unitButton,
              unit === 'INCH' && styles.unitButtonActive,
            ]}>
            <Text
              style={[
                styles.unitText,
                unit === 'INCH' && styles.unitTextActive,
              ]}>
              Inches
            </Text>
          </Pressable>

          <Pressable
            disabled={saving}
            onPress={() => setUnit('CM')}
            style={[
              styles.unitButton,
              unit === 'CM' && styles.unitButtonActive,
            ]}>
            <Text
              style={[styles.unitText, unit === 'CM' && styles.unitTextActive]}>
              Centimetres
            </Text>
          </Pressable>
        </View>

        {/* Measurement fields */}
        {fields.map(field => (
          <View key={field.key} style={styles.row}>
            <Text style={styles.label}>{field.label}</Text>

            <View style={styles.inputWrap}>
              <TextInput
                value={values[field.key]}
                onChangeText={value => updateValue(field.key, value)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
                editable={!saving}
                style={styles.value}
              />

              <Text style={styles.unit}>{unit === 'INCH' ? 'in' : 'cm'}</Text>
            </View>
          </View>
        ))}

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 30,
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

  row: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  label: {
  flex: 1,
  fontSize: 12,
  fontWeight: '500',
  color: colors.text,
  paddingRight: 16,
},

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
    ...(typeof document !== 'undefined' ? { outline: 'none' } : {}),
  },

  unit: {
    width: 22,
    marginLeft: 7,
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'left',
  },

  buttonContainer: {
    marginTop: 20,
  },
})
