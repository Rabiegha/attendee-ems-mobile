/**
 * Composants Skeleton pour les états de chargement
 * Animations fluides pour remplacer les spinners
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton pour une Card d'événement
export const EventCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.md,
        },
      ]}
    >
      <Skeleton width="60%" height={20} borderRadius={6} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={16} borderRadius={6} style={{ marginBottom: 6 }} />
      <Skeleton width="80%" height={16} borderRadius={6} style={{ marginBottom: 16 }} />
      <View style={styles.row}>
        <Skeleton width={80} height={28} borderRadius={14} style={{ marginRight: 8 }} />
        <Skeleton width={80} height={28} borderRadius={14} />
      </View>
    </View>
  );
};

// Skeleton pour une ligne de liste de participants
export const AttendeeListItemSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        },
      ]}
    >
      <View style={styles.row}>
        <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={14} borderRadius={6} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

// Skeleton pour un groupe de cartes (dashboard)
export const DashboardCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.dashboardCard,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.lg,
        },
      ]}
    >
      <Skeleton width="50%" height={16} borderRadius={6} style={{ marginBottom: 12 }} />
      <Skeleton width="30%" height={32} borderRadius={8} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={14} borderRadius={6} />
    </View>
  );
};

// Container avec plusieurs skeletons
interface SkeletonListProps {
  count?: number;
  renderItem: () => React.ReactNode;
  style?: any;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  renderItem,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>{renderItem()}</View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
  },
  listItem: {
    marginHorizontal: 16,
  },
  dashboardCard: {
    margin: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
