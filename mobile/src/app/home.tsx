import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { BottomNav, IconCircle, Screen, SectionTitle } from '../components'

import { colors } from '../theme'

import { useAuth } from '../auth/AuthContext'

import { DashboardResponse, getDashboard } from '../api/dashboard'

const quick = [
  ['♙', 'Clients', 'Manage all clients', '/clients'],
  ['⌁', 'New Measurement', 'Add or update', '/new-measurement'],
  [
    '✦',
    'AI Style Studio',
    'Get personalised style recommendation for any client',
    '/ai',
  ],
  ['▣', 'Saved Designs', 'Your custom designs', '/styles'],
  [
    '◈',
    'Measurement Guide',
    'How to take accurate measurements',
    '/new-measurement',
  ],
  ['◫', 'Reports & History', 'View client history and feedback', '/clients'],
] as const

function formatDate(dateString?: string) {
  if (!dateString) {
    return 'No measurements yet'
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return 'No measurements yet'
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(name: string) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
}

export default function Home() {
  const { user, token, loading: authLoading } = useAuth()

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)

  const [loading, setLoading] = useState(true)

  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const data = await getDashboard(token)

      setDashboard(data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)

      setError(err instanceof Error ? err.message : 'Unable to load dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      loadDashboard()
    }
  }, [token, loadDashboard])

  /*
   * Use the name returned by the authenticated
   * user. If the name isn't available yet, we
   * temporarily use "Tailor".
   */
  const firstName = user?.name?.trim()?.split(' ')[0] || 'Tailor'

  const recentClients = dashboard?.recentClients ?? []

  const stats = dashboard?.stats ?? {
    clients: 0,
    savedStyles: 0,
    recentMeasurements: 0,
  }

  return (
    <Screen>
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDashboard(true)}
            />
          }>
          {/* Header */}
          <View style={styles.top}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, {firstName} 👋</Text>

              <Text style={styles.sub}>Let’s create the perfect fit</Text>
            </View>
          </View>

          {/* AI Banner */}
          <Pressable
            onPress={() => router.push('/ai' as any)}
            style={styles.aiBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <Image
                source={require('../../assets/images/sparkle.png')}
                style={styles.sparkle}
                resizeMode="cover"
              />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.aiTitle}>AI Style Studio</Text>

              <Text style={styles.aiSub}>
                Get personalized style recommendations for any client
              </Text>
              </View>
              </View>

            <View style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </Pressable>

          {/* Dashboard loading */}
          {loading && !dashboard ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.purple} />

              <Text style={styles.loadingText}>Loading your dashboard...</Text>
            </View>
          ) : null}

          {/* Error */}
          {error && !loading ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load dashboard</Text>

              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                onPress={() => loadDashboard()}
                style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Dashboard content */}
          {!loading || dashboard ? (
            <>
              {/* Statistics */}

              {/* Quick actions */}
              <View style={styles.grid}>
                {quick.map(([icon, title, desc, route]) => (
                  <Pressable
                    key={title}
                    onPress={() => router.push(route as any)}
                    style={styles.quick}>
                    <View style={styles.quickRow}>
                      <IconCircle text={icon} />
                      <View style={styles.quickText}>
                        <Text style={styles.quickTitle}>{title}</Text>
                        <Text style={styles.quickDesc}>{desc}</Text>
                      </View>
                    </View>
                    
                  </Pressable>
                ))}
              </View>

              {/* Recent clients */}
              <SectionTitle title="Recent Clients" action="View all" />

              {recentClients.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>♙</Text>

                  <Text style={styles.emptyTitle}>No clients yet</Text>

                  <Text style={styles.emptyText}>
                    Add your first client to start managing measurements and fit
                    profiles.
                  </Text>

                  <Pressable
                    onPress={() => router.push('/add-client' as any)}
                    style={styles.emptyButton}>
                    <Text style={styles.emptyButtonText}>Add a client</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.clientList}>
                  {recentClients.map(client => {
                    const latestMeasurement = client.measurements?.[0]

                    return (
                      <Pressable
                        key={client.id}
                        onPress={() =>
                          router.push(`/client/${client.id}` as any)
                        }
                        style={styles.clientRow}>
                        {client.avatarUrl ? (
                          <Image
                            source={{
                              uri: client.avatarUrl,
                            }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={styles.initialAvatar}>
                            <Text style={styles.initialAvatarText}>
                              {getInitials(client.name)}
                            </Text>
                          </View>
                        )}

                        <View style={styles.clientInfo}>
                          <Text style={styles.clientName}>{client.name?.charAt(0)?.toUpperCase()}{client.name?.slice(1)}</Text>
                        </View>

                        <Text style={styles.chev}>›</Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </>
          ) : null}
        </ScrollView>

        <BottomNav active="Home" />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 20,
  },

  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  greetingContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
  },

  sub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },

  bellButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bell: {
    fontSize: 24,
    color: colors.text,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.purple,
  },

  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },

  aiBanner: {
    backgroundColor: colors.deep,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
sparkle: {
    width: 60,
    height: 60,
  },
  aiTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },

  aiSub: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
    opacity: 0.9,
  },

  arrow: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowText: {
    fontSize: 20,
    color: colors.purple,
    marginTop: -2,
  },

  grid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 22,
  },

  quick: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    minHeight: 112,
  },

  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  quickText: {
    flex: 1,
    minWidth: 0,
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  quickDesc: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    marginTop: 3,
  },

  clientList: {
    gap: 8,
  },

  clientRow: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },

  initialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: colors.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  initialAvatarText: {
    color: colors.purple,
    fontSize: 13,
    fontWeight: '800',
  },

  clientInfo: {
    flex: 1,
  },

  clientName: {
    fontSize: 13,
    color: colors.muted,
  },

  clientDate: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },

  chev: {
    fontSize: 24,
    color: colors.muted,
    paddingHorizontal: 6,
  },

  loadingContainer: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 10,
  },

  errorCard: {
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#F0CCCC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  errorTitle: {
    color: '#A42828',
    fontSize: 15,
    fontWeight: '800',
  },

  errorText: {
    color: '#7A4A4A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  retryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 28,
    color: colors.purple,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 260,
  },

  emptyButton: {
    backgroundColor: colors.purple,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 14,
  },

  emptyButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
})
