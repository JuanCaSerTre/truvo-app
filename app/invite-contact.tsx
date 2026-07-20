import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PrimaryInput } from '@/components/auth/PrimaryInput';
import { TrustNetworkHeader } from '@/components/trust/TrustNetworkHeader';
import { InvitationCard } from '@/components/trust/InvitationCard';
import { RelationshipCard, RelationshipAction } from '@/components/trust/RelationshipCard';
import { TrustEmptyState } from '@/components/trust/TrustEmptyState';
import { colors, spacing, typography } from '@/constants/theme';
import { useTruvoStore } from '@/hooks/useTruvoStore';
import { userSafeMessage } from '@/utils/errors';
import { isValidEmail, normalizeEmail } from '@/utils/validation';
import { buildRelationships, Relationship } from '@/utils/trustNetwork';

export default function TrustNetworkScreen() {
  const { createContact, contacts, agreements, payments, currentUser } = useTruvoStore();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const relationships = useMemo(
    () => buildRelationships(contacts, agreements, payments, currentUser),
    [agreements, contacts, currentUser, payments],
  );

  const stats = useMemo(() => {
    const active = relationships.filter((r) => r.agreementsActive > 0).length;
    const pending = relationships.filter((r) => r.health.state === 'waiting').length;
    return { total: relationships.length, active, pending };
  }, [relationships]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return relationships;
    return relationships.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.statusLabel.toLowerCase().includes(q) ||
        String(r.agreementsTotal).includes(q),
    );
  }, [query, relationships]);

  // Invitation logic unchanged: still persists a contact via createContact.
  const invite = async (email: string, name: string) => {
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Enter a valid email');
      return;
    }
    try {
      setLoading(true);
      await createContact({ contactEmail: normalizedEmail, contactName: name.trim() || undefined });
      Alert.alert('Invitation ready', 'They\'ve been added to your Trust Network and will be suggested when you create agreements.');
    } catch {
      Alert.alert('Could not send invitation', userSafeMessage('Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const actionsFor = (r: Relationship): RelationshipAction[] => [
    { key: 'create', label: 'Create Agreement', icon: 'add-circle-outline', onPress: () => router.push('/create') },
    { key: 'view', label: 'View Agreements', icon: 'documents-outline', onPress: () => router.push('/(tabs)/agreements') },
    { key: 'invite', label: 'Invite Again', icon: 'mail-outline', onPress: () => invite(r.email, r.name) },
  ];

  return (
    <ScreenContainer>
      <View>
        <Text style={styles.title}>Trust Network</Text>
        <Text style={styles.copy}>Manage the people you trust and create agreements faster.</Text>
      </View>

      <TrustNetworkHeader total={stats.total} active={stats.active} pending={stats.pending} />

      <InvitationCard senderName={currentUser.name || 'You'} loading={loading} onInvite={invite} />

      <View style={styles.networkHeader}>
        <Text style={styles.sectionTitle}>Your Trust Network</Text>
        {relationships.length > 0 ? <Text style={styles.count}>{relationships.length}</Text> : null}
      </View>

      {relationships.length === 0 ? (
        <TrustEmptyState
          title="Your Trust Network is empty."
          message="Invite someone you trust to start creating clear agreements together."
        />
      ) : (
        <>
          <PrimaryInput label="Search name, email, or status" icon="search-outline" value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} />
          {filtered.length === 0 ? (
            <TrustEmptyState icon="search-outline" title="No matches" message="No one in your Trust Network matches that search." />
          ) : (
            <View style={styles.list}>
              {filtered.map((r, index) => (
                <RelationshipCard key={r.id} relationship={r} index={index} actions={actionsFor(r)} />
              ))}
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.h1,
    fontWeight: '900',
  },
  copy: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: '900',
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontWeight: '900',
  },
  list: {
    gap: spacing.md,
  },
});
