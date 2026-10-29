import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'

import { Screen } from '../../components'
import { colors } from '../../theme'

import { Client, deleteClient, getClient } from '../../api/clients'

export default function ClientDetails() {
  const { id } = useLocalSearchParams<{
    id: string
  }>()

  const [client, setClient] = useState<Client | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    loadClient()
  }, [id])

  async function loadClient() {
    try {
      setLoading(true)

      const response = await getClient(id)

      setClient(response.client)
    } catch (err) {
      Alert.alert(
        'Unable to load client',
        err instanceof Error ? err.message : 'Client could not be loaded.',
        [
          {
            text: 'Go back',
            onPress: () => router.back(),
          },
        ],
      )
    } finally {
      setLoading(false)
    }
  }

  function confirmDelete() {
    if (!client) return

    Alert.alert(
      'Delete client',
      `Delete ${client.name} and all their measurements?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(client.id)

              router.replace('/clients' as any)
            } catch (err) {
              Alert.alert(
                'Delete failed',
                err instanceof Error ? err.message : 'Unable to delete client.',
              )
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.purple} />

          <Text style={styles.loadingText}>Loading client...</Text>
        </View>
      </Screen>
    )
  }

  if (!client) {
    return null
  }

  const latestMeasurement = client.measurements?.[0]

  const latestProfile = client.fitProfiles?.[0]

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {client.name
                .split(' ')
                .slice(0, 2)
                .map(x => x[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name}>{client.name}</Text>

            <Text style={styles.meta}>
              {client.gender ? client.gender.toLowerCase() : 'Client'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryAction}
            onPress={() =>
              router.push(`/new-measurement?clientId=${client.id}` as any)
            }>
            <Text style={styles.primaryActionText}>Add Measurement</Text>
          </Pressable>

          {latestMeasurement && (
            <Pressable
              style={styles.secondaryAction}
              onPress={() =>
                router.push(
                  `/edit-measurement?id=${latestMeasurement.id}&clientId=${client.id}` as any,
                )
              }>
              <Text style={styles.secondaryActionText}>Update Measurement</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.aiDesignButton}
            onPress={() =>
              router.push(`/ai-design?clientId=${client.id}` as any)
            }>
            <Text style={styles.aiDesignButtonText}>✦ Create AI Design</Text>
          </Pressable>
        </View>

        <Section title="Contact">
          <InfoRow label="Phone" value={client.phone || 'Not provided'} />

          <InfoRow label="Email" value={client.email || 'Not provided'} />

          <InfoRow
            label="Date of birth"
            value={
              client.dateOfBirth
                ? new Date(client.dateOfBirth).toLocaleDateString('en-GB')
                : 'Not provided'
            }
          />
        </Section>

        <Section title="Latest Measurement">
          {latestMeasurement ? (
            <View>
              <InfoRow label="Unit" value={latestMeasurement.unit} />

              <InfoRow
                label="Chest"
                value={
                  latestMeasurement.chest
                    ? `${latestMeasurement.chest} ${latestMeasurement.unit === 'INCH' ? 'in' : 'cm'}`
                    : 'Not recorded'
                }
              />

              <InfoRow
                label="Waist"
                value={
                  latestMeasurement.waist
                    ? `${latestMeasurement.waist} ${latestMeasurement.unit === 'INCH' ? 'in' : 'cm'}`
                    : 'Not recorded'
                }
              />

              <InfoRow
                label="Hip"
                value={
                  latestMeasurement.hip
                    ? `${latestMeasurement.hip} ${latestMeasurement.unit === 'INCH' ? 'in' : 'cm'}`
                    : 'Not recorded'
                }
              />
            </View>
          ) : (
            <EmptySection text="No measurements have been recorded yet." />
          )}
        </Section>

        <Section title="Fit Profile">
          {latestProfile ? (
            <>
              <View style={styles.fitScore}>
                <Text style={styles.fitScoreNumber}>{latestProfile.score}</Text>

                <Text style={styles.fitScoreLabel}>FIT SCORE</Text>
              </View>

              <Text style={styles.bodyShape}>{latestProfile.bodyShape}</Text>

              <Text style={styles.summary}>{latestProfile.summary}</Text>
            </>
          ) : (
            <EmptySection text="A fit profile will appear after measurements are added." />
          )}
        </Section>

        <Pressable onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Client</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.card}>{children}</View>
    </View>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function EmptySection({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
  },

  back: {
    marginBottom: 18,
  },

  backText: {
    color: colors.purple,
    fontSize: 13,
    fontWeight: '700',
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  avatarText: {
    color: colors.purple,
    fontSize: 17,
    fontWeight: '800',
  },

  headerInfo: {
    flex: 1,
  },

  name: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },

  meta: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },

  primaryAction: {
    flex: 1,
    backgroundColor: colors.purple,
    borderRadius: 9,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryActionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  secondaryAction: {
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 9,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  secondaryActionText: {
    color: colors.purple,
    fontSize: 11,
    fontWeight: '800',
  },

  section: {
    marginBottom: 16,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    padding: 13,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 10,
  },

  infoValue: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },

  fitScore: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },

  fitScoreNumber: {
    color: colors.purple,
    fontSize: 19,
    fontWeight: '800',
  },

  fitScoreLabel: {
    color: colors.muted,
    fontSize: 6,
    fontWeight: '700',
  },

  bodyShape: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },

  summary: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 5,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: '#E2BABA',
    borderRadius: 9,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  deleteText: {
    color: '#A42828',
    fontSize: 11,
    fontWeight: '700',
  },
  aiDesignButton: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 9,
    backgroundColor: colors.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiDesignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
})
