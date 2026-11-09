import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { BottomNav, Header, PrimaryButton, Screen } from '../components'
import { colors } from '../theme'
import { getSavedDesigns, SavedDesign } from '../api/ai-designs'

const GARMENT_FILTERS = ['All', 'Dress', 'Kaftan', 'Two-Piece', 'Senator', 'Blouse & Skirt']

export default function Styles() {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [search, setSearch] = useState('')
  const [garment, setGarment] = useState('All')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce typing so we don't hit the API on every keystroke.
  const [query, setQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    try {
      setError(null)
      const { designs } = await getSavedDesigns({
        search: query || undefined,
        garment: garment === 'All' ? undefined : garment,
      })
      setDesigns(designs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load designs.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [query, garment])

  // Runs when the screen gains focus (e.g. after deleting a design) and whenever the filters change.
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load]),
  )

  const filtered = query !== '' || garment !== 'All'

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load()
              }}
            />
          }
        >
          <Header title="Saved Designs" back />
          <Text style={styles.title}>Your Designs</Text>
          <Text style={styles.sub}>
            AI designs generated for your clients
            {designs.length ? ` · ${designs.length}` : ''}
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by design or client name"
            placeholderTextColor={colors.muted}
            style={styles.search}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {GARMENT_FILTERS.map(g => (
              <Pressable
                key={g}
                onPress={() => setGarment(g)}
                style={[styles.chip, garment === g && styles.chipActive]}
              >
                <Text style={[styles.chipText, garment === g && styles.chipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
          ) : error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Couldn't load designs</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable onPress={load}>
                <Text style={styles.retry}>Try again</Text>
              </Pressable>
            </View>
          ) : designs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{filtered ? 'No matching designs' : 'No designs yet'}</Text>
              <Text style={styles.emptyText}>
                {filtered
                  ? 'Try a different search or garment.'
                  : 'Open a client and generate an AI design. It will be saved here.'}
              </Text>
              {!filtered && (
                <View style={{ marginTop: 14, alignSelf: 'stretch' }}>
                  <PrimaryButton label="Go to Clients" onPress={() => router.push('/clients' as any)} />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.grid}>
              {designs.map(d => (
                <Pressable key={d.id} onPress={() => router.push(`/style/${d.id}` as any)} style={styles.card}>
                  <Image source={{ uri: d.imageUrl }} style={styles.img} resizeMode="cover" />
                  <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>For {d.client.name}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.tag}>{d.garmentType}</Text>
                    <Text style={styles.date}>{formatDate(d.createdAt)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        <BottomNav active="Designs" />
      </View>
    </Screen>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 21, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: 12 },
  search: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  chips: { gap: 6, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 9,
  },
  img: { width: '100%', aspectRatio: 3 / 4, borderRadius: 8, backgroundColor: '#eee' },
  name: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 8 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  tag: {
    fontSize: 11,
    color: colors.purple,
    backgroundColor: colors.softPurple,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '700',
  },
  date: { fontSize: 11, color: colors.muted },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'center' },
  retry: { fontSize: 14, color: colors.purple, fontWeight: '700', marginTop: 12 },
})
