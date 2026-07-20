import { Ionicons } from '@expo/vector-icons';
import { Agreement, Contact, Payment, User } from '@/types/models';
import { colors } from '@/constants/theme';
import { getPendingPayments } from '@/utils/agreementRules';

export type RelationshipStatus = 'trusted' | 'invitation_sent' | 'pending_join' | 'no_agreements' | 'inactive';
export type RelationshipHealthState = 'active' | 'excellent' | 'waiting' | 'no_activity' | 'needs_attention';

export interface RelationshipHealth {
  state: RelationshipHealthState;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
}

export interface Relationship {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  statusLabel: string;
  agreementsTotal: number;
  agreementsActive: number;
  agreementsCompleted: number;
  lastInteraction?: string;
  health: RelationshipHealth;
}

const monthYear = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const statusLabels: Record<RelationshipStatus, string> = {
  trusted: 'Trusted',
  invitation_sent: 'Invitation Sent',
  pending_join: 'Pending Join',
  no_agreements: 'No Active Agreements',
  inactive: 'Inactive',
};

const DAY = 86_400_000;

/**
 * Derives the health of a RELATIONSHIP inside TRUVO — never a score of the person.
 * Reflects only the state of shared agreements & activity.
 */
const deriveHealth = (
  active: number,
  total: number,
  needsAttention: boolean,
  lastActivityMs: number | null,
): RelationshipHealth => {
  if (needsAttention) {
    return { state: 'needs_attention', label: 'Agreement Needs Attention', detail: 'One agreement requires action.', icon: 'alert-circle', color: colors.danger, tint: '#FEE2E2' };
  }
  if (total === 0) {
    return { state: 'waiting', label: 'Waiting for Invitation', detail: 'No agreements created yet.', icon: 'hourglass', color: colors.warning, tint: '#FEF3C7' };
  }
  if (active > 0) {
    return { state: 'active', label: 'Active Relationship', detail: 'You currently have active agreements.', icon: 'pulse', color: colors.secondary, tint: '#D1FAE5' };
  }
  if (lastActivityMs !== null && Date.now() - lastActivityMs > 120 * DAY) {
    return { state: 'no_activity', label: 'No Recent Activity', detail: 'No agreements for several months.', icon: 'time', color: colors.warning, tint: '#FEF3C7' };
  }
  return { state: 'excellent', label: 'Excellent Communication', detail: 'Everything confirmed.', icon: 'checkmark-circle', color: colors.secondary, tint: '#D1FAE5' };
};

/** Builds the trust-network relationships from saved contacts + agreements + payments. */
export const buildRelationships = (contacts: Contact[], agreements: Agreement[], payments: Payment[], currentUser: User): Relationship[] => {
  return contacts.map((contact) => {
    const email = contact.contactEmail.toLowerCase();
    const shared = agreements.filter(
      (a) =>
        (a.lenderId === currentUser.id || a.borrowerEmail?.toLowerCase() === currentUser.email?.toLowerCase()) &&
        a.borrowerEmail?.toLowerCase() === email,
    );
    const active = shared.filter((a) => a.status === 'active').length;
    const completed = shared.filter((a) => a.status === 'completed').length;
    const sharedIds = new Set(shared.map((a) => a.id));

    const relatedPayments = payments.filter((p) => sharedIds.has(p.agreementId));
    const lastPayment = relatedPayments
      .map((p) => new Date(p.confirmedAt || p.createdAt).getTime())
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a)[0];
    const needsAttention =
      shared.some((a) => a.status === 'active' && getPendingPayments(a.id, payments).some((p) => p.receiverId === currentUser.id)) ||
      relatedPayments.some((p) => p.status === 'rejected');

    let status: RelationshipStatus;
    if (shared.length === 0) status = 'no_agreements';
    else if (active > 0) status = 'trusted';
    else status = 'inactive';

    const lastInteraction = lastPayment ? new Date(lastPayment) : undefined;

    return {
      id: contact.id,
      name: contact.contactName || contact.contactEmail.split('@')[0],
      email: contact.contactEmail,
      memberSince: monthYear(contact.createdAt),
      statusLabel: statusLabels[status],
      agreementsTotal: shared.length,
      agreementsActive: active,
      agreementsCompleted: completed,
      lastInteraction: lastInteraction ? lastInteraction.toISOString() : undefined,
      health: deriveHealth(active, shared.length, needsAttention, lastPayment ?? null),
    };
  });
};
