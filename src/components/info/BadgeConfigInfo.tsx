/**
 * Composant d'information sur la configuration des badges
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

export const BadgeConfigInfo: React.FC = () => {
  const showInfo = () => {
    Alert.alert(
      '✅ Template de Badge Configuré',
      'Un template de badge par défaut a été créé avec succès !\n\n' +
      '• Design : Dégradé bleu élégant\n' +
      '• Informations : Nom, email, type de participant\n' +
      '• Format : 400x600 pixels\n' +
      '• Compatible : PDF et impression\n\n' +
      'L\'impression des badges devrait maintenant fonctionner correctement.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <View style={{ 
      backgroundColor: '#e7f5e7', 
      padding: 12, 
      margin: 10, 
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50'
    }}>
      <TouchableOpacity onPress={showInfo}>
        <Text style={{ 
          color: '#2e7b2e', 
          fontWeight: '600',
          fontSize: 14
        }}>
          ✅ Template de badge configuré avec succès
        </Text>
        <Text style={{ 
          color: '#5a8e5a', 
          fontSize: 12,
          marginTop: 4
        }}>
          Appuyez pour voir les détails
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BadgeConfigInfo;