/**
 * Hook pour gérer les modales de confirmation
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'danger' | 'primary';
  icon?: string;
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean;
  onConfirm: () => void;
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    confirmColor: 'danger',
    icon: 'alert-circle-outline',
    onConfirm: () => {},
  });

  const confirm = useCallback((
    options: ConfirmOptions,
    onConfirm: () => void
  ) => {
    setState({
      visible: true,
      ...options,
      onConfirm,
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    setState(prev => ({ ...prev, visible: false }));
  }, [state.onConfirm]);

  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleCancel,
  };
};
