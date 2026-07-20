import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface HealthRow {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  status: string;
  percent: number;
  future?: boolean;
}

/** Account health checklist with a progress indicator per item. */
export function AccountHealthCard({ rows }: { rows: HealthRow[] }) {
  return (
    <View style={styles.card}>
      {rows.map((row, index) => {
        const color = row.future ? colors.textMuted : row.percent >= 100 ? colors.secondary : row.percent >= 50 ? colors.warning : colors.danger;
        return (
          <View key={row.key} style={[styles.row, index < rows.length - 1 && styles.rowBorder]}>
            <View style={[styles.icon, { backgroundColor: `${color}1A` }]}>
              <Ionicons name={row.icon} size={18} color={color} />
            </View>
            <View style={styles.copy}>
              <View style={styles.copyTop}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={[styles.status, { color }]}>{row.status}</Text>
              </View>
              <ProgressBar percent={row.percent} color={color} height={6} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  copyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '800',
  },
  status: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
});
