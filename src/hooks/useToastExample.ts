/**
 * Hook useToastExample
 * Démontre comment utiliser les toasts dans l'application
 */

import { useToast } from '../contexts/ToastContext';

// Exemple d'utilisation dans un composant :
/*
export const MyComponent = () => {
  const toast = useToast();
  
  const handleSuccess = () => {
    toast.success('Opération réussie !');
  };
  
  const handleError = () => {
    toast.error('Une erreur est survenue');
  };
  
  const handleWarning = () => {
    toast.warning('Attention, action risquée');
  };
  
  const handleInfo = () => {
    toast.info('Information importante', 5000); // Durée personnalisée
  };
  
  return (
    <View>
      <Button title="Succès" onPress={handleSuccess} />
      <Button title="Erreur" onPress={handleError} />
      <Button title="Avertissement" onPress={handleWarning} />
      <Button title="Info" onPress={handleInfo} />
    </View>
  );
};
*/

// Exemples d'utilisation dans les actions asynchrones:
/*
// Dans un thunk Redux
const loginThunk = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.login(credentials);
    // ✓ Afficher un toast de succès après login réussi
    toast.success('Connexion réussie !');
    return response.data;
  } catch (error) {
    // ✗ Afficher un toast d'erreur
    toast.error('Échec de la connexion');
    return rejectWithValue(error);
  }
});

// Dans un check-in
const handleCheckIn = async (attendeeId: string) => {
  try {
    await checkInService.checkIn(attendeeId);
    toast.success('Participant enregistré avec succès');
  } catch (error) {
    toast.error('Erreur lors de l\'enregistrement');
  }
};

// Dans une impression de badge
const handlePrintBadge = async (attendeeId: string) => {
  toast.info('Impression en cours...', 1000);
  try {
    await printService.printBadge(attendeeId);
    toast.success('Badge imprimé avec succès');
  } catch (error) {
    toast.error('Échec de l\'impression');
  }
};
*/

export {};
