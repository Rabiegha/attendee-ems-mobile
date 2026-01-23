/**
 * Skeleton loader pour l'écran Guest List
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { Card } from '../ui/Card';

export const GuestListSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={{ padding: theme.spacing.lg }}>
      {/* Card Liste des participants skeleton */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <SkeletonLoader width="60%" height={24} style={{ marginBottom: theme.spacing.xs }} />
        <SkeletonLoader width="40%" height={16} />
      </Card>

      {/* Card statistiques skeleton */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <SkeletonLoader width="100%" height={80} />
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <SkeletonLoader width="100%" height={80} />
          </View>
        </View>
      </Card>

      {/* Card graphique skeleton */}
      <Card>
        <SkeletonLoader width="50%" height={20} style={{ marginBottom: theme.spacing.md }} />
        <SkeletonLoader width="100%" height={150} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
