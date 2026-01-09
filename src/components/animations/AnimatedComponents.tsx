/**
 * Composants d'animation réutilisables
 * Utilise Animated natif de React Native
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';

// Les animations layout ne sont pas supportées avec Animated natif
// Utiliser les composants wrapper ci-dessous

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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim }]}>
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[style, { transform: [{ scale: scaleAnim }] }]}
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
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateX: slideAnim }] }]}>
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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: scale,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
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
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shake) {
      Animated.sequence([
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shake]);

  return (
    <Animated.View style={[style, { transform: [{ translateX }] }]}>
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
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[style, { transform: [{ rotate }] }]}>
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
