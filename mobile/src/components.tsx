import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from './theme';

// Content stops growing past this width on tablets / web and is centred.
export const MAX_CONTENT_WIDTH = 720;

export function Screen({ children, dark = false, style }: { children: ReactNode; dark?: boolean; style?: ViewStyle }) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: dark ? colors.deep : colors.bg }]}>
      <View style={[styles.screenInner, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function Header({
  title,
  back = false,
  action = '⋯',
  backFallback = '/home',
}: {
  title: string;
  back?: boolean;
  action?: string;
  // Where "back" goes when there is no previous screen (deep link, web reload).
  backFallback?: string;
}) {
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(backFallback as any);
  }

  return (
    <View style={styles.header}>
      <Pressable onPress={() => (back ? goBack() : router.push('/home' as any))} style={styles.headerBtn}>
        <Text style={styles.headerIcon}>{back ? '‹' : '☰'}</Text>
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      <Pressable style={styles.headerBtn}><Text style={styles.headerIcon}>{action}</Text></Pressable>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  compact = false,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primary,
        compact && styles.primaryCompact,
        disabled && styles.primaryDisabled,
      ]}
    >
      <Text style={styles.primaryText}>
        {label}
      </Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={styles.outline}><Text style={styles.outlineText}>{label}</Text></Pressable>;
}

export function BottomNav({ active = 'Home' }: { active?: string }) {
  const items = [
    ['⌂', 'Home', '/home'],
    ['♙', 'Clients', '/clients'],
    ['＋', '', '/new-measurement'],
    ['▣', 'Designs', '/styles'],
    ['◎', 'Profile', '/profile'],
  ] as const;
  return (
    <View style={styles.nav}>
      {items.map(([icon, label, route]) => {
        const isPlus = label === '';
        return <Pressable key={route} onPress={() => router.push(route as any)} style={styles.navItem}>
          {isPlus ? <View style={styles.plus}><Text style={styles.plusText}>＋</Text></View> : <Text style={[styles.navIcon, active === label && styles.navActive]}>{icon}</Text>}
          {!isPlus && <Text style={[styles.navLabel, active === label && styles.navActive]}>{label}</Text>}
        </Pressable>;
      })}
    </View>
  );
}

export function Pill({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return <View style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text></View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionText}>{title}</Text>{action && <Text style={styles.sectionAction}>{action}</Text>}</View>;
}

export function IconCircle({ text }: { text: string }) {
  return <View style={styles.iconCircle}><Text style={styles.iconCircleText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenInner: { flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  header: { height: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 25, color: colors.text, fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  primary: { backgroundColor: colors.purple, minHeight: 48, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryCompact: { minHeight: 40 },
  primaryDisabled: { opacity: 0.55},
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  outline: { minHeight: 46, borderRadius: 9, borderWidth: 1, borderColor: colors.purple, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  outlineText: { color: colors.purple, fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.lilac },
  pillActive: { backgroundColor: colors.purple },
  pillText: { fontSize: 13, color: colors.muted },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionText: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionAction: { color: colors.purple, fontSize: 14, fontWeight: '700' },
  iconCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.softPurple, alignItems: 'center', justifyContent: 'center' },
  iconCircleText: { color: colors.purple, fontSize: 18 },
  nav: { height: 74, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 4 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 58 },
  navIcon: { fontSize: 21, color: colors.muted, lineHeight: 25 },
  navLabel: { fontSize: 11, color: colors.muted, marginTop: 1 },
  navActive: { color: colors.purple, fontWeight: '800' },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', marginTop: -18, borderWidth: 4, borderColor: '#fff' },
  plusText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
