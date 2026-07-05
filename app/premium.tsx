import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';

export default function PremiumSubscriptionScreen() {
  const { currentUser, subscribe } = useTruvoStore();
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);

  const choose = async (plan: 'monthly' | 'yearly') => {
    try {
      setLoadingPlan(plan);
      const result = await subscribe(plan);
      if (result.checkoutUrl) {
        await Linking.openURL(result.checkoutUrl);
        return;
      }
      Alert.alert('Checkout unavailable', result.message || 'Premium checkout is not configured yet.');
    } catch (error) {
      Alert.alert('Could not start checkout', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>TRUVO Premium</Text>
      <Text style={styles.copy}>Free users can have up to 3 active agreements. Premium unlocks unlimited active agreements.</Text>
      <View style={styles.plan}>
        <Text style={styles.planName}>Monthly</Text>
        <Text style={styles.price}>$3.99</Text>
        <PrimaryButton label="Choose monthly" onPress={() => choose('monthly')} loading={loadingPlan === 'monthly'} />
      </View>
      <View style={[styles.plan, styles.featured]}>
        <Text style={styles.planName}>Yearly</Text>
        <Text style={styles.price}>$29.99</Text>
        <Text style={styles.save}>Best value</Text>
        <PrimaryButton label="Choose yearly" variant="secondary" onPress={() => choose('yearly')} loading={loadingPlan === 'yearly'} />
      </View>
      <Text style={styles.status}>Current status: {currentUser.subscription_status.replace('_', ' ')}</Text>
      <Text style={styles.note}>Premium activates only after a real checkout confirmation.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typography.h1, fontWeight: '900' },
  copy: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  plan: { padding: spacing.xl, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  featured: { borderColor: colors.secondary },
  planName: { color: colors.text, fontSize: typography.h2, fontWeight: '900' },
  price: { color: colors.primary, fontSize: 38, fontWeight: '900' },
  save: { color: colors.secondary, fontSize: typography.small, fontWeight: '900' },
  status: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  note: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20 },
});
