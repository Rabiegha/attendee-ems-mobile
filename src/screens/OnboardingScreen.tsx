/**
 * Écran d'onboarding avec slides
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useOnboarding } from '../hooks/useOnboarding';
import { hapticLight } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: '📅',
    title: 'Gérez vos événements',
    description: 'Accédez facilement à tous vos événements à venir et passés. Consultez les détails et statistiques en temps réel.',
  },
  {
    id: '2',
    icon: '👥',
    title: 'Participants en un coup d\'œil',
    description: 'Visualisez la liste complète des participants, recherchez rapidement et consultez les informations détaillées.',
  },
  {
    id: '3',
    icon: '✓',
    title: 'Check-in instantané',
    description: 'Enregistrez les participants d\'un simple geste. Suivez la progression en temps réel avec les statistiques.',
  },
  {
    id: '4',
    icon: '🎫',
    title: 'Impression de badges',
    description: 'Imprimez les badges directement depuis l\'app. Configuration simple et impression rapide.',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    hapticLight();
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    hapticLight();
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View
      style={[
        styles.slide,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.content}>
        {/* Icône */}
        <Text style={styles.icon}>{item.icon}</Text>

        {/* Titre */}
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text.primary,
              fontSize: theme.fontSize['2xl'],
              fontWeight: theme.fontWeight.bold,
            },
          ]}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.base,
            },
          ]}
        >
          {item.description}
        </Text>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: theme.colors.brand[600],
              opacity: currentIndex === index ? 1 : 0.3,
              width: currentIndex === index ? 20 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.skipText,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.base,
            },
          ]}
        >
          Passer
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />

      {/* Footer avec pagination et bouton */}
      <View style={styles.footer}>
        {renderPagination()}

        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: theme.colors.brand[600],
              borderRadius: theme.radius.xl,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.nextButtonText,
              {
                color: '#FFFFFF',
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
              },
            ]}
          >
            {currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 16,
    marginRight: 8,
  },
  skipText: {
    textAlign: 'right',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    paddingTop: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  nextButtonText: {
    textAlign: 'center',
  },
});
