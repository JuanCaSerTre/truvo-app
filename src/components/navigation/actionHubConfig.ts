import { Ionicons } from '@expo/vector-icons';

export interface ActionHubItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  /** Route to push when tapped. Omit for "coming soon" items. */
  route?: string;
  comingSoon?: boolean;
}

/**
 * The Action Hub registry. Adding a future action (Create Reminder, Generate PDF,
 * Scan QR, Import CSV, Request Signature, …) is a one-line entry here — the sheet,
 * navigation, and layout adapt automatically. No navigation changes required.
 */
export const ACTION_HUB_ITEMS: ActionHubItem[] = [
  {
    key: 'create-agreement',
    icon: 'document-text',
    title: 'Create Agreement',
    description: 'Create a new personal agreement.',
    route: '/create',
  },
  {
    key: 'register-payment',
    icon: 'cash',
    title: 'Register Payment',
    description: 'Record a payment for an active agreement.',
    route: '/(tabs)/payments',
  },
  {
    key: 'invite',
    icon: 'person-add',
    title: 'Invite Someone',
    description: 'Invite another person to use TRUVO.',
    route: '/invite-contact',
  },
  {
    key: 'import',
    icon: 'download',
    title: 'Import Agreement',
    description: 'Bring in an existing agreement.',
    comingSoon: true,
  },
  {
    key: 'scan',
    icon: 'scan',
    title: 'Scan Agreement',
    description: 'Capture an agreement with your camera.',
    comingSoon: true,
  },
];
