import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Card, Header, OutlineButton, PrimaryButton, Screen } from '../../components'
import { colors } from '../../theme'
import { deleteSavedDesign, getSavedDesign, SavedDesign } from '../../api/ai-designs'

export default function StyleDetails() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [design, setDesign] = useState<SavedDesign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSavedDesign(id)
      .then(res => setDesign(res.design))
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load design.'))
      .finally(() => setLoading(false))
  }, [id])

  async function doDelete() {
    if (!design) return
    try {
      setDeleting(true)
      await deleteSavedDesign(design.id)
      if (router.canGoBack()) router.back()
      else router.replace('/styles' as any)
    } catch (err) {
      setDeleting(false)
      showMessage('Delete failed', err instanceof Error ? err.message : 'Unable to delete design.')
    }
  }

  function confirmDelete() {
    if (!design) return
    const message = `Delete "${design.name}"? This can't be undone.`
    // Alert buttons don't work on web, so use the browser's confirm dialog there.
    if (Platform.OS === 'web') {
      if (window.confirm(message)) doDelete()
      return
    }
    Alert.alert('Delete design', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ])
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} />
        </View>
      </Screen>
    )
  }

  if (error || !design) {
    return (
      <Screen>
        <Header title="Design Details" back backFallback="/styles" action="" />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Design not available</Text>
          <Text style={styles.errorText}>{error ?? 'This design could not be found.'}</Text>
        </View>
      </Screen>
    )
  }

  const shownOnModel = design.designData?.mode === 'text'

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Design Details" back backFallback="/styles" action="" />

        <View style={styles.top}>
          <Text style={styles.title}>{design.name}</Text>
          <Text style={styles.tag}>{design.garmentType}</Text>
        </View>
        <Pressable onPress={() => router.push(`/client/${design.client.id}` as any)}>
          <Text style={styles.sub}>
            For <Text style={styles.link}>{design.client.name}</Text> · {formatDate(design.createdAt)}
          </Text>
        </Pressable>

        <Image source={{ uri: design.imageUrl }} style={styles.heroImg} resizeMode="cover" />
        {shownOnModel && (
          <Text style={styles.notice}>Shown on a model (generated without the client's photo).</Text>
        )}

        <Card style={styles.specCard}>
          <Text style={styles.heading}>Design Specifications</Text>
          <Spec label="Garment" value={design.garmentType} />
          <Spec label="Style" value={design.style} />
          <Spec label="Fabric" value={design.fabric} />
          <Spec label="Colour" value={design.colour} />
          <Spec label="Occasion" value={design.occasion} />
          {design.designData?.measurementUnit && (
            <Spec
              label="Measurements"
              value={design.designData.measurementUnit === 'CM' ? 'Centimetres' : 'Inches'}
            />
          )}
        </Card>

        <Text style={styles.helper}>
          This is an AI-generated design concept. The client's recorded measurements remain the source of truth for
          tailoring.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton
            label="✦ Generate a Variation"
            onPress={() =>
              router.push(
                `/ai-design?clientId=${design.client.id}&garment=${encodeURIComponent(design.garmentType)}` as any,
              )
            }
          />
          <OutlineButton label="View Client" onPress={() => router.push(`/client/${design.client.id}` as any)} />
          <Pressable onPress={confirmDelete} disabled={deleting} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete Design'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  )
}

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`)
  else Alert.alert(title, message)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  errorText: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'center' },
  top: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text },
  tag: {
    fontSize: 12,
    color: colors.purple,
    backgroundColor: colors.softPurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    fontWeight: '700',
  },
  sub: { paddingHorizontal: 16, fontSize: 13, color: colors.muted, marginTop: 4 },
  link: { color: colors.purple, fontWeight: '700' },
  heroImg: {
    width: '92%',
    aspectRatio: 2 / 3,
    alignSelf: 'center',
    borderRadius: 12,
    backgroundColor: '#eee',
    marginTop: 12,
  },
  notice: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
  specCard: { marginTop: 14, marginHorizontal: 16 },
  heading: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  spec: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  specLabel: { fontSize: 13, color: colors.muted },
  specValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  helper: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 12, paddingHorizontal: 16 },
  actions: { padding: 16, gap: 8 },
  deleteBtn: { alignItems: 'center', paddingVertical: 12 },
  deleteText: { fontSize: 14, color: '#C62828', fontWeight: '700' },
})
