/**
 * Composant ProfileButton - Bouton de profil réutilisable pour la navigation
 * Taille fixe pour alignement cohérent dans tous les headers
 * Utilise getParent() pour naviguer vers le RootStack depuis n'importe quel niveau
 */

import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import Icons from '../../assets/icons';

interface ProfileButtonProps {
  size?: number;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ size = 24 }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handlePress = () => {
    // Naviguer vers Profile dans le RootStack
    // Utiliser getParent() pour accéder au navigateur parent si nécessaire
    try {
      // @ts-ignore
      const rootNavigation = navigation.getParent() || navigation;
      rootNavigation.navigate('Profile');
    } catch (error) {
      console.error('[ProfileButton] Navigation error:', error);
      // Fallback : essayer la navigation directe
      // @ts-ignore
      navigation.navigate('Profile');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.7}
    >
      <Image 
        source={Icons.Profil} 
        style={{ width: size, height: size }} 
        tintColor={theme.colors.brand[600]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
