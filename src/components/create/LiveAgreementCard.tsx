import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgreementField } from './AgreementField';
import { AgreementStatusBadge, DraftStatus } from './AgreementStatusBadge';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface LiveAgreementData {
  agreementId: string;
  createdDate: string;
  status: DraftStatus;
  lender: string;
  borrower?: string | null;
  principal?: string | null;
  interest?: string | null;
  repayment?: string | null;
  totalRepayment?: string | null;
  estimatedFinish?: string | null;
  /** When true, numeric fields show "Waiting…" instead of "Not defined yet". */
  borrowerSelected: boolean;
}

/**
 * The signature "Live Agreement": a document that visibly evolves as the user fills the flow.
 * Every field animates on change (see AgreementField). Placeholders are friendly, never A$0 / 0.
 */
export function LiveAgreementCard({ data }: { data: LiveAgreementData }) {
  const numericPlaceholder = data.borrowerSelected ? 'Waiting…' : 'Not defined yet';

  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.markDot}>
            <Ionicons name="document-text" size={14} color={colors.secondary} />
          </View>
          <View>
            <Text style={styles.eyebrow}>LIVE AGREEMENT</Text>
            <Text style={styles.agreementId}>{data.agreementId}</Text>
          </View>
        </View>
        <AgreementStatusBadge status={data.status} />
      </View>

      <Text style={styles.created}>Created {data.createdDate}</Text>

      <View style={styles.divider} />

      <View style={styles.fields}>
        <AgreementField label="Lender" value={data.lender} placeholder="You" />
        <AgreementField label="Borrower" value={data.borrower} placeholder="Waiting for borrower" />
        <AgreementField label="Principal" value={data.principal} placeholder={data.borrowerSelected ? 'Waiting for amount' : numericPlaceholder} />
        <AgreementField label="Interest" value={data.interest} placeholder={numericPlaceholder} />
        <AgreementField label="Repayment" value={data.repayment} placeholder={numericPlaceholder} />
        <AgreementField label="Estimated finish" value={data.estimatedFinish} placeholder="Will be calculated automatically" />
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Repayment</Text>
        <AgreementField label="" value={data.totalRepayment} placeholder="Will be calculated automatically" emphasize />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: 26,
    backgroundColor: colors.primary,
    gap: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 6,
  },
  glow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  markDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  agreementId: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '900',
  },
  created: {
    color: '#64748B',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: spacing.sm,
  },
  fields: {
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  totalLabel: {
    color: '#CBD5E1',
    fontSize: typography.small,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
