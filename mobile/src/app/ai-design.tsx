import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../components';
import { colors } from '../theme';
import { getClient, type Client } from '../api/clients';
import { generateAIDesign } from '../api/ai-designs';

const GARMENTS = ['Dress', 'Kaftan', 'Two-Piece', 'Senator', 'Blouse & Skirt'];
const STYLES = ['Modern', 'Elegant', 'Traditional', 'Minimal', 'Statement'];
const FABRICS = ['Ankara', 'Lace', 'Kente', 'Plain', 'Let AI choose'];
const COLOURS = ['Wine', 'Emerald', 'Royal Blue', 'Black', 'Gold', 'Let AI choose'];
const OCCASIONS = ['Wedding', 'Church', 'Office', 'Casual', 'Special Event'];

export default function AIDesign() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState('Dress');
  const [style, setStyle] = useState('Modern');
  const [fabric, setFabric] = useState('Let AI choose');
  const [colour, setColour] = useState('Let AI choose');
  const [occasion, setOccasion] = useState('Special Event');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedName, setGeneratedName] = useState('');

  useEffect(() => { if (clientId) loadClient(clientId); }, [clientId]);

  async function loadClient(id: string) {
    try { setLoading(true); setClient((await getClient(id)).client); }
    catch (error) { Alert.alert('Unable to load client', error instanceof Error ? error.message : 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  const latestMeasurement = useMemo(() => client?.measurements?.[0], [client]);

  async function choosePhoto(useCamera: boolean) {
    const permission = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission required', `Please allow ${useCamera ? 'camera' : 'photo library'} access to create the AI design.`);
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.85, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert('Photo error', 'The selected photo could not be prepared for AI processing.'); return; }
    setPhoto(asset.uri);
    setPhotoDataUrl(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
    setGeneratedImage(null);
  }

  async function handleGenerate() {
    if (!clientId || !client) return;
    if (!photoDataUrl) { Alert.alert('Add a photo', 'Take or choose a full-body photo of the client first.'); return; }
    if (!latestMeasurement) {
      Alert.alert('Measurements required', 'Add at least one measurement record before generating a personalized design.', [
        { text: 'Add Measurement', onPress: () => router.push(`/new-measurement?clientId=${clientId}` as any) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      setGenerating(true);
      const response = await generateAIDesign(clientId, { imageDataUrl: photoDataUrl, garmentType, style, fabric, colour, occasion });
      setGeneratedImage(response.design.imageDataUrl || response.design.imageUrl);
      setGeneratedName(response.design.name);
    } catch (error) {
      console.error('AI design generation failed:', error);
      Alert.alert('Unable to generate design', error instanceof Error ? error.message : 'Something went wrong while generating the design.');
    } finally { setGenerating(false); }
  }

  if (loading) return <Screen><View style={styles.loading}><ActivityIndicator color={colors.purple} /></View></Screen>;
  if (!client) return <Screen><Header title="AI Design Studio" back /><View style={styles.empty}><Text style={styles.emptyText}>Client not found.</Text></View></Screen>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="AI Design Studio" back />
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>✦ Design for {client.name}</Text>
          <Text style={styles.heroText}>Use the client photo together with their saved measurements to create a personalized garment concept.</Text>
        </View>

        <Card style={styles.photoCard}>
          <Text style={styles.sectionTitle}>Client Photo</Text>
          <Text style={styles.helper}>Use a clear, full-body, front-facing photo where the clothing outline is visible.</Text>
          {photo ? <Image source={{ uri: photo }} style={styles.photoPreview} /> : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>◉</Text><Text style={styles.placeholderTitle}>No photo selected</Text>
              <Text style={styles.helper}>Take a photo or choose one from the gallery.</Text>
            </View>
          )}
          <View style={styles.photoButtons}>
            <Pressable style={styles.outlineButton} onPress={() => choosePhoto(true)} disabled={generating}><Text style={styles.outlineText}>Take Photo</Text></Pressable>
            <Pressable style={styles.outlineButton} onPress={() => choosePhoto(false)} disabled={generating}><Text style={styles.outlineText}>Choose Photo</Text></Pressable>
          </View>
        </Card>

        <Card style={styles.cardSpacing}>
          <View style={styles.rowBetween}><Text style={styles.sectionTitle}>Measurements</Text><Text style={styles.ready}>{latestMeasurement ? '✓ Ready' : 'Required'}</Text></View>
          {latestMeasurement ? <View style={styles.measureGrid}>
            <Measure label="Chest" value={latestMeasurement.chest} unit={latestMeasurement.unit} />
            <Measure label="Waist" value={latestMeasurement.waist} unit={latestMeasurement.unit} />
            <Measure label="Hip" value={latestMeasurement.hip} unit={latestMeasurement.unit} />
            <Measure label="Shoulder" value={latestMeasurement.shoulderWidth} unit={latestMeasurement.unit} />
            <Measure label="Sleeve" value={latestMeasurement.sleeveLength} unit={latestMeasurement.unit} />
            <Measure label="Back" value={latestMeasurement.backLength} unit={latestMeasurement.unit} />
          </View> : <Text style={styles.helper}>No measurements have been recorded for this client.</Text>}
        </Card>

        <Card style={styles.cardSpacing}>
          <Text style={styles.sectionTitle}>Design Preferences</Text>
          <ChoiceGroup label="Garment" values={GARMENTS} selected={garmentType} onSelect={setGarmentType} />
          <ChoiceGroup label="Style" values={STYLES} selected={style} onSelect={setStyle} />
          <ChoiceGroup label="Fabric" values={FABRICS} selected={fabric} onSelect={setFabric} />
          <ChoiceGroup label="Colour" values={COLOURS} selected={colour} onSelect={setColour} />
          <ChoiceGroup label="Occasion" values={OCCASIONS} selected={occasion} onSelect={setOccasion} />
        </Card>

        {generatedImage && <Card style={styles.resultCard}>
          <Text style={styles.sectionTitle}>AI Suggested Design</Text>
          <Image source={{ uri: generatedImage }} style={styles.generatedImage} resizeMode="cover" />
          <Text style={styles.designName}>{generatedName}</Text>
          <Text style={styles.helper}>This is an AI-generated design concept. The recorded measurements remain the source of truth for tailoring.</Text>
          <View style={{ marginTop: 12 }}><PrimaryButton label="Customize Design" onPress={() => router.push(`/customize?clientId=${clientId}` as any)} /></View>
        </Card>}

        <View style={styles.generateWrap}>
          {generating ? <View style={styles.generating}><ActivityIndicator color="#fff" /><Text style={styles.generatingText}>Designing your garment...</Text></View> : <PrimaryButton label="✦ Generate AI Design" onPress={handleGenerate} />}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Measure({ label, value, unit }: { label: string; value?: number | null; unit: 'INCH' | 'CM' }) {
  return <View style={styles.measureItem}><Text style={styles.measureLabel}>{label}</Text><Text style={styles.measureValue}>{value ?? '—'} {unit === 'INCH' ? 'in' : 'cm'}</Text></View>;
}

function ChoiceGroup({ label, values, selected, onSelect }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.choiceGroup}><Text style={styles.choiceLabel}>{label}</Text><View style={styles.chips}>{values.map(value => <Pressable key={value} onPress={() => onSelect(value)} style={[styles.chip, selected === value && styles.chipSelected]}><Text style={[styles.chipText, selected === value && styles.chipTextSelected]}>{value}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, empty: { padding: 24 }, emptyText: { color: colors.muted, fontSize: 13 },
  hero: { marginHorizontal: 16, backgroundColor: colors.deep, borderRadius: 14, padding: 16, marginBottom: 12 }, heroTitle: { color: '#fff', fontSize: 15, fontWeight: '800' }, heroText: { color: '#fff', opacity: 0.9, fontSize: 10, lineHeight: 15, marginTop: 7 },
  photoCard: { marginHorizontal: 16 }, cardSpacing: { marginHorizontal: 16, marginTop: 10 }, resultCard: { marginHorizontal: 16, marginTop: 10 }, sectionTitle: { color: colors.text, fontSize: 12, fontWeight: '800' }, helper: { color: colors.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  photoPlaceholder: { height: 260, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center', padding: 20 }, photoPreview: { width: '100%', height: 330, marginTop: 12, borderRadius: 12, backgroundColor: '#eee' }, photoIcon: { fontSize: 32, color: colors.purple }, placeholderTitle: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 8 },
  photoButtons: { flexDirection: 'row', gap: 8, marginTop: 10 }, outlineButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: colors.purple, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, outlineText: { color: colors.purple, fontSize: 10, fontWeight: '700' }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ready: { color: colors.green, fontSize: 9, fontWeight: '800' },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, measureItem: { width: '31%', backgroundColor: colors.lilac, borderRadius: 8, padding: 8 }, measureLabel: { color: colors.muted, fontSize: 8 }, measureValue: { color: colors.text, fontSize: 10, fontWeight: '800', marginTop: 3 },
  choiceGroup: { marginTop: 12 }, choiceLabel: { color: colors.text, fontSize: 10, fontWeight: '700', marginBottom: 7 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff' }, chipSelected: { backgroundColor: colors.purple, borderColor: colors.purple }, chipText: { color: colors.muted, fontSize: 9 }, chipTextSelected: { color: '#fff', fontWeight: '700' },
  generateWrap: { marginHorizontal: 16, marginTop: 14 }, generating: { minHeight: 48, backgroundColor: colors.purple, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, generatingText: { color: '#fff', fontSize: 12, fontWeight: '700' }, generatedImage: { width: '100%', height: 420, borderRadius: 12, marginTop: 10, backgroundColor: '#eee' }, designName: { color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 10 },
});
