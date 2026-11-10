import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OutlineButton, PrimaryButton, Screen } from '../components';
import { colors } from '../theme';

export default function Index() {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={styles.logoText}>
          Tailored <Text style={styles.gold}>toFit</Text>
        </Text>

        <Text style={styles.tag}>
          AI-POWERED TAILORING
        </Text>

        {/* Model image */}
        <Image
          source={require('../../assets/images/tailoringMannequin.png')}
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },


  logo: {
    maxWidth: 300,
    width: 300,
    height: 300,
    aspectRatio: 1,
  },

  brandIcon: {
    color: colors.gold,
    fontSize: 42,
  },

  tapeText: {
    color: colors.gold,
    fontSize: 17,
  },

  logoText: {
    color: '#00001A',
    fontSize: 27,
    fontWeight: '700',
    fontFamily: 'serif',
    marginTop: -8,
  },

  gold: {
    color: colors.gold,
  },

  tag: {
    color: '#00001A',
    fontSize: 12,
    letterSpacing: 1.6,
    marginTop: -4,
  },

  model: {
    maxWidth: 300,
    width: 300,
    height: 300,
    aspectRatio: 1,
    opacity: 0.72,
    marginVertical: 4,
  },

  hero: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 23,
    marginTop: -2,
  },

  actions: {
    width: '100%',
    maxWidth: 360,
    gap: 10,
    marginTop: 16,
  },

  footer: {
    color: '#00001A',
    fontSize: 12,
    opacity: 0.85,
    marginTop: 8,
  },
});