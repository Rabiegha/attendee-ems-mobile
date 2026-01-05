/**
 * Exemple d'utilisation de ConfirmModal et du feedback haptique
 * Utiliser ce pattern dans les actions destructives de l'application
 */

import React from 'react';
import { View, Button } from 'react-native';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { hapticHeavy } from '../utils/haptics';
import { useToast } from '../contexts/ToastContext';

export const ConfirmModalExample = () => {
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const toast = useToast();

  // Exemple 1: Confirmation de suppression
  const handleDelete = () => {
    hapticHeavy(); // Vibration forte avant la modale
    
    confirm(
      {
        title: 'Supprimer le participant',
        message: 'Êtes-vous sûr de vouloir supprimer ce participant ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmColor: 'danger',
        icon: '🗑️',
      },
      async () => {
        // Action à effectuer après confirmation
        try {
          // await deleteParticipant(id);
          toast.success('Participant supprimé avec succès');
        } catch (error) {
          toast.error('Erreur lors de la suppression');
        }
      }
    );
  };

  // Exemple 2: Confirmation de déconnexion
  const handleLogout = () => {
    hapticHeavy();
    
    confirm(
      {
        title: 'Déconnexion',
        message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
        confirmText: 'Se déconnecter',
        cancelText: 'Annuler',
        confirmColor: 'danger',
        icon: '👋',
      },
      async () => {
        // await logout();
        toast.success('Déconnexion réussie');
      }
    );
  };

  // Exemple 3: Confirmation d'action non destructive
  const handleArchive = () => {
    confirm(
      {
        title: 'Archiver l\'événement',
        message: 'Voulez-vous archiver cet événement ? Il restera accessible dans les archives.',
        confirmText: 'Archiver',
        cancelText: 'Annuler',
        confirmColor: 'primary',
        icon: '📦',
      },
      async () => {
        // await archiveEvent(id);
        toast.success('Événement archivé');
      }
    );
  };

  return (
    <View>
      <Button title="Supprimer" onPress={handleDelete} />
      <Button title="Déconnexion" onPress={handleLogout} />
      <Button title="Archiver" onPress={handleArchive} />
      
      <ConfirmModal
        visible={confirmState.visible}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        confirmColor={confirmState.confirmColor}
        icon={confirmState.icon}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
};

// Pour intégrer dans un écran existant:
/*
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { hapticHeavy } from '../utils/haptics';

const MyScreen = () => {
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const handleDangerousAction = () => {
    hapticHeavy();
    confirm(
      {
        title: 'Titre',
        message: 'Message de confirmation',
        confirmText: 'Confirmer',
        confirmColor: 'danger',
      },
      () => {
        // Action après confirmation
      }
    );
  };

  return (
    <View>
      {/* Votre contenu *\/}
      
      <ConfirmModal
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  );
};
*/
