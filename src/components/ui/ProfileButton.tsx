/**
 * Composant ProfileButton - Bouton de profil réutilisable pour la navigation
 * Taille fixe pour alignement cohérent dans tous les headers
 * Utilise getParent() pour naviguer vers le RootStack depuis n'importe quel niveau
 */

import React, { useCallback } from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeProvider";
import Icons from "../../assets/icons";

interface ProfileButtonProps {
  size?: number;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ size = 24 }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handlePress = useCallback(() => {
    // Naviguer vers Profile dans le RootStack
    try {
      // @ts-ignore - Navigation types can be complex
      navigation.navigate("Profile");
    } catch (error) {
      console.error("[ProfileButton] Navigation error:", error);
    }
  }, [navigation]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.7}
    >
      <Image
        source={Icons.Profil}
        style={{
          width: size,
          height: size,
          tintColor: theme.colors.brand[600],
        }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
