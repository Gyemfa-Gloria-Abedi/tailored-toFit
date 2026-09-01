import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, PrimaryButton, OutlineButton } from '../components';
import { colors } from '../theme';

export default function Index() {
  return (
    <Screen dark>
      <View style={styles.container}>
        {/* Brand mark */}
        {/* <View style={styles.brandMark}>
          <Text style={styles.brandIcon}>✦</Text>

          <View style={styles.tape}>
            <Text style={styles.tapeText}>⌁</Text>
          </View>
        </View> */}

        {/* Logo */}
        <Text style={styles.logo}>
          Tailored <Text style={styles.gold}>toFit</Text>
        </Text>

        <Text style={styles.tag}>
          AI-POWERED TAILORING
        </Text>

        {/* Model image */}
        <Image
          source={require('../../assets/images/senator.png')}
          style={styles.model}
          resizeMode="cover"
        />

        {/* Hero text */}
        <Text style={styles.hero}>
          Smart measurements.{'\n'}
          Perfect styles. Every time.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            label="Get Started"
            onPress={() => router.push('/register' as any)}
          />

          <OutlineButton
            label="Login"
            onPress={() => router.push('/login' as any)}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Made for tailors. Designed for perfection.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },

  brandMark: {
    marginTop: 12,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#D7A91F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandIcon: {
    color: colors.gold,
    fontSize: 42,
  },

  tape: {
    position: 'absolute',
    right: -8,
    bottom: -2,
    width: 28,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tapeText: {
    color: colors.gold,
    fontSize: 15,
  },

  logo: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '700',
    fontFamily: 'serif',
    marginTop: -8,
  },

  gold: {
    color: colors.gold,
  },

  tag: {
    color: '#fff',
    fontSize: 10,
    letterSpacing: 1.6,
    marginTop: -4,
  },

  model: {
    width: 170,
    height: 210,
    opacity: 0.72,
    marginVertical: 4,
  },

  hero: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginTop: -2,
  },

  actions: {
    width: '100%',
    gap: 10,
  },

  footer: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.85,
    marginTop: 8,
  },
});