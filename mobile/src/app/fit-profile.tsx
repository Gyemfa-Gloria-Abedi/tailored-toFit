// Frontend screen: save as app/fit-profile.tsx (same folder as the AI Design screen).
// Open with: router.push(`/fit-profile?clientId=${clientId}`)

import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  getFitProfile,
  type FitProfileResponse,
  type StyleRecommendation,
} from '../api/fit-profile'
import { Card, Header, PrimaryButton, Screen } from '../components'
import { colors } from '../theme'

const WARNING = '#B7791F'

export default function FitProfileScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>()
  const [data, setData] = useState<FitProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    try {
      setError(null)
      setData(await getFitProfile(clientId))
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])

  if (loading)
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} />
        </View>
      </Screen>
    )

  if (error || !data)
    return (
      <Screen>
        <Header title="Fit Profile" back />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error ?? 'No fit profile available.'}</Text>
          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              label="Add Measurement"
              onPress={() => router.push(`/new-measurement?clientId=${clientId}` as any)}
            />
          </View>
        </View>
      </Screen>
    )

  const { profile, recommendations } = data
  const scoreColor =
    profile.score >= 85 ? colors.green : profile.score >= 65 ? colors.purple : WARNING

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load()
            }}
          />
        }>
        <Header title="Fit Profile" back />

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.heroLabel}>Body shape</Text>
              <Text style={styles.heroTitle}>{profile.bodyShape}</Text>
              <Text style={styles.heroText}>{profile.summary}</Text>
            </View>
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text style={styles.scoreValue}>{profile.score}</Text>
              <Text style={styles.scoreLabel}>{profile.scoreLabel}</Text>
            </View>
          </View>
          <Text style={styles.heroFoot}>
            Score reflects how complete and consistent the measurements are. Measured{' '}
            {new Date(data.measuredAt).toLocaleDateString()}.
          </Text>
        </View>

        {/* Warnings */}
        {profile.warnings.length > 0 && (
          <Card style={[styles.cardSpacing, styles.warningCard]}>
            <Text style={[styles.sectionTitle, { color: WARNING }]}>Check these measurements</Text>
            {profile.warnings.map(w => (
              <Bullet key={w} text={w} color={WARNING} />
            ))}
          </Card>
        )}

        {/* Ratios */}
        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>Proportions</Text>
          <View style={styles.grid}>
            <Stat label="Waist : Hip" value={profile.ratios.waistToHip} />
            <Stat label="Chest : Hip" value={profile.ratios.chestToHip} />
            <Stat label="Waist : Chest" value={profile.ratios.waistToChest} />
            <Stat label="Shoulder line" text={profile.shoulderLine} />
          </View>
          {profile.missing.length > 0 && (
            <Text style={styles.helper}>
              Not recorded: {profile.missing.map(humanize).join(', ')}
            </Text>
          )}
        </Card>

        {/* Strengths & guidance */}
        {profile.strengths.length > 0 && (
          <Card style={styles.cardSpacing}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            {profile.strengths.map(s => (
              <Bullet key={s} text={s} color={colors.green} />
            ))}
          </Card>
        )}

        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>Tailoring guidance</Text>
          {profile.recommendations.map(r => (
            <Bullet key={r} text={r} color={colors.purple} />
          ))}
          {profile.avoid.length > 0 && (
            <>
              <Text style={[styles.choiceLabel, { marginTop: 10 }]}>Use with care</Text>
              {profile.avoid.map(a => (
                <Bullet key={a} text={a} color={colors.muted} />
              ))}
            </>
          )}
        </Card>

        {/* Recommended styles */}
        {recommendations.length > 0 && (
          <>
            <Text style={styles.listTitle}>Recommended styles</Text>
            {recommendations.map(rec => (
              <StyleCard key={rec.name} rec={rec} clientId={clientId!} />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

function StyleCard({ rec, clientId }: { rec: StyleRecommendation; clientId: string }) {
  return (
    <Card style={styles.cardSpacing}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.styleName}>{rec.name}</Text>
          <Text style={styles.styleCategory}>{rec.category}</Text>
        </View>
        <View style={styles.matchPill}>
          <Text style={styles.matchText}>{rec.score}% match</Text>
        </View>
      </View>
      <Text style={styles.helper}>{rec.description}</Text>
      <View style={{ marginTop: 6 }}>
        {rec.reasons.map(r => (
          <Bullet key={r} text={r} color={colors.purple} />
        ))}
      </View>
      <Pressable
        style={styles.outlineButton}
        onPress={() =>
          router.push(
            `/ai-design?clientId=${clientId}&garment=${encodeURIComponent(rec.garmentType)}` as any,
          )
        }>
        <Text style={styles.outlineText}>✦ Design this with AI</Text>
      </Pressable>
    </Card>
  )
}

function Stat({ label, value, text }: { label: string; value?: number | null; text?: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{text ?? (value != null ? value.toFixed(2) : '—')}</Text>
    </View>
  )
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

function humanize(field: string) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { padding: 24 },
  emptyText: { color: colors.muted, fontSize: 15 },
  hero: {
    marginHorizontal: 16,
    backgroundColor: colors.deep,
    borderRadius: 14,
    padding: 16,
    marginBottom: 2,
  },
  heroLabel: { color: '#fff', opacity: 0.75, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  heroText: { color: '#fff', opacity: 0.9, fontSize: 12, lineHeight: 17, marginTop: 6 },
  heroFoot: { color: '#fff', opacity: 0.6, fontSize: 11, marginTop: 10 },
  scoreRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  scoreLabel: { color: '#fff', fontSize: 11, opacity: 0.85 },
  cardSpacing: { marginHorizontal: 16, marginTop: 10 },
  warningCard: { borderWidth: 1, borderColor: WARNING },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  listTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginHorizontal: 16,
    marginTop: 18,
  },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6 },
  choiceLabel: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  statItem: { width: '48%', backgroundColor: colors.lilac, borderRadius: 8, padding: 8 },
  statLabel: { color: colors.muted, fontSize: 11 },
  statValue: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 3 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  bulletText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17 },
  styleName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  styleCategory: { color: colors.muted, fontSize: 11, marginTop: 2 },
  matchPill: {
    backgroundColor: colors.lilac,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  matchText: { color: colors.purple, fontSize: 11, fontWeight: '800' },
  outlineButton: {
    minHeight: 40,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { color: colors.purple, fontSize: 12, fontWeight: '700' },
})
