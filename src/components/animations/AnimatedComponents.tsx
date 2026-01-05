/**
 * Composants d'animation réutilisables
 * Utilise react-native-reanimated pour des animations performantes
 */

import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { ViewStyle } from 'react-native';

// Export des animations prédéfinies pour utilisation directe
export {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
};

// Configuration d'animation par défaut
export const springConfig = {
  damping: 15,
  stiffness: 100,
};

export const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

/**
 * FadeInView - Composant avec animation fade in au montage
 */
interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(duration).delay(delay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

/**
 * ScaleButton - Bouton avec effet de scale au press
 */
interface ScaleButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  scale?: number;
}

export const ScaleButton: React.FC<ScaleButtonProps> = ({
  children,
  onPress,
  style,
  scale = 0.95,
}) => {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = () => {
    scaleValue.value = withSpring(scale, springConfig);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, springConfig);
  };

  return (
    <Animated.View
      style={[animatedStyle, style]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      {children}
    </Animated.View>
  );
};

/**
 * SlideInView - Composant avec animation slide depuis la droite
 */
interface SlideInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  return (
    <Animated.View
      entering={SlideInRight.duration(duration).delay(delay)}
      exiting={SlideOutLeft.duration(duration)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};

/**
 * PulseView - Composant avec animation pulse continue
 */
interface PulseViewProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  style?: ViewStyle;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  scale = 1.1,
  duration = 1000,
  style,
}) => {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(scale, { duration: duration / 2 }),
        withTiming(1, { duration: duration / 2 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

/**
 * ShakeView - Composant qui peut être "secoué" pour attirer l'attention
 */
interface ShakeViewProps {
  children: React.ReactNode;
  shake?: boolean;
  style?: ViewStyle;
}

export const ShakeView: React.FC<ShakeViewProps> = ({
  children,
  shake = false,
  style,
}) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (shake) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [shake]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

/**
 * RotateView - Composant avec rotation continue
 */
interface RotateViewProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export const RotateView: React.FC<RotateViewProps> = ({
  children,
  duration = 1000,
  style,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

/**
 * StaggeredList - Container pour animer des éléments de liste avec délai
 */
interface StaggeredListProps {
  children: React.ReactNode[];
  stagger?: number;
  style?: ViewStyle;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  stagger = 50,
  style,
}) => {
  return (
    <Animated.View style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeInView delay={index * stagger}>
          {child}
        </FadeInView>
      ))}
    </Animated.View>
  );
};
