/**
 * Hook pour synchroniser les données via WebSocket
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../api/socket.service';
import { selectIsAuthenticated } from '../store/auth.slice';
import { setPrintersAndValidateSelection } from '../store/emsPrinters.slice';

export const useSocketSync = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    // Connexion au WebSocket
    socketService.connect();

    // Événements pour les registrations
    const handleRegistrationCreated = (data: any) => {
      console.log('[Socket] Registration created:', data);
      // Dispatch une action Redux pour ajouter la registration
      dispatch({ type: 'registrations/created', payload: data });
    };

    const handleRegistrationUpdated = (data: any) => {
      console.log('[Socket] Registration updated:', data);
      // Dispatch une action Redux pour mettre à jour la registration
      dispatch({ type: 'registrations/updated', payload: data });
    };

    const handleRegistrationDeleted = (data: any) => {
      console.log('[Socket] Registration deleted:', data);
      // Dispatch une action Redux pour supprimer la registration
      dispatch({ type: 'registrations/deleted', payload: data });
    };

    const handleRegistrationCheckedIn = (data: any) => {
      console.log('[Socket] Registration checked-in:', data);
      // Dispatch une action Redux pour mettre à jour le check-in
      dispatch({ type: 'registrations/checkedIn', payload: data });
    };

    // Événements pour les events
    const handleEventCreated = (data: any) => {
      console.log('[Socket] Event created:', data);
      dispatch({ type: 'events/created', payload: data });
    };

    const handleEventUpdated = (data: any) => {
      console.log('[Socket] Event updated:', data);
      dispatch({ type: 'events/updated', payload: data });
    };

    const handleEventDeleted = (data: any) => {
      console.log('[Socket] Event deleted:', data);
      dispatch({ type: 'events/deleted', payload: data });
    };

    // Événements pour les sessions
    const handleSessionCreated = (data: any) => {
      console.log('[Socket] Session created:', data);
      dispatch({ type: 'sessions/created', payload: data });
    };

    const handleSessionUpdated = (data: any) => {
      console.log('[Socket] Session updated:', data);
      dispatch({ type: 'sessions/updated', payload: data });
    };

    const handleSessionDeleted = (data: any) => {
      console.log('[Socket] Session deleted:', data);
      dispatch({ type: 'sessions/deleted', payload: data });
    };

    // Événements pour les imprimantes exposées
    const handlePrintersUpdated = (data: any) => {
      console.log('[Socket] Printers updated:', data?.length, 'printer(s)');
      if (Array.isArray(data)) {
        dispatch(setPrintersAndValidateSelection(data));
      }
    };

    // S'abonner aux événements
    socketService.on('registration:created', handleRegistrationCreated);
    socketService.on('registration:updated', handleRegistrationUpdated);
    socketService.on('registration:deleted', handleRegistrationDeleted);
    socketService.on('registration:checked-in', handleRegistrationCheckedIn);
    
    socketService.on('event:created', handleEventCreated);
    socketService.on('event:updated', handleEventUpdated);
    socketService.on('event:deleted', handleEventDeleted);
    
    socketService.on('session:created', handleSessionCreated);
    socketService.on('session:updated', handleSessionUpdated);
    socketService.on('session:deleted', handleSessionDeleted);
    
    socketService.on('printers:updated', handlePrintersUpdated);

    // Cleanup
    return () => {
      socketService.off('registration:created', handleRegistrationCreated);
      socketService.off('registration:updated', handleRegistrationUpdated);
      socketService.off('registration:deleted', handleRegistrationDeleted);
      socketService.off('registration:checked-in', handleRegistrationCheckedIn);
      
      socketService.off('event:created', handleEventCreated);
      socketService.off('event:updated', handleEventUpdated);
      socketService.off('event:deleted', handleEventDeleted);
      
      socketService.off('session:created', handleSessionCreated);
      socketService.off('session:updated', handleSessionUpdated);
      socketService.off('session:deleted', handleSessionDeleted);
      
      socketService.off('printers:updated', handlePrintersUpdated);
    };
  }, [isAuthenticated, dispatch]);
};
