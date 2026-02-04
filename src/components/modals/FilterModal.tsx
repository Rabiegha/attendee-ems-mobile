/**
 * FilterModal - Modal pour filtrer les participants
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterOptions {
  attendeeTypeIds: string[];
  statuses: string[];
  checkedIn: 'all' | 'checked-in' | 'not-checked-in';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  attendeeTypes: Array<{ id: string; name: string; color_hex: string }>;
}

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Approuvé', color: '#10B981' },
  { value: 'awaiting', label: 'En attente', color: '#F59E0B' },
  { value: 'refused', label: 'Refusé', color: '#EF4444' },
  { value: 'cancelled', label: 'Annulé', color: '#6B7280' },
];

const CHECKIN_OPTIONS = [
  { value: 'all', label: 'Tous', icon: 'list' as const },
  { value: 'checked-in', label: 'Enregistrés', icon: 'checkmark-circle' as const },
  { value: 'not-checked-in', label: 'Non enregistrés', icon: 'close-circle' as const },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  attendeeTypes,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters);
      setIsModalVisible(true);
      // Animer l'entrée: fade de l'overlay + slide de la popup
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else if (isModalVisible) {
      // Animer la sortie: slide de la popup + fade de l'overlay
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Cacher le modal après l'animation
        setIsModalVisible(false);
        // Réinitialiser les positions pour la prochaine fois
        slideAnim.setValue(SCREEN_HEIGHT);
        fadeAnim.setValue(0);
      });
    }
  }, [visible, currentFilters]);

  const toggleAttendeeType = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      attendeeTypeIds: prev.attendeeTypeIds.includes(typeId)
        ? prev.attendeeTypeIds.filter(id => id !== typeId)
        : [...prev.attendeeTypeIds, typeId],
    }));
  };

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      attendeeTypeIds: [],
      statuses: [],
      checkedIn: 'all',
    };
    setFilters(resetFilters);
  };

  const activeFiltersCount = 
    filters.attendeeTypeIds.length + 
    filters.statuses.length + 
    (filters.checkedIn !== 'all' ? 1 : 0);

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            opacity: fadeAnim,
          }
        ]}
      >
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContainer,
            { 
              backgroundColor: theme.colors.background,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom,
              maxHeight: SCREEN_HEIGHT * 0.85,
            }
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="filter" size={24} color={theme.colors.brand[600]} />
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                Filtres
              </Text>
              {activeFiltersCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.brand[600] }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.text.inverse }]}>{activeFiltersCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Types de participants */}
            {attendeeTypes.length > 0 && (
              <View style={[styles.section, { marginBottom: theme.spacing.lg }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Types de participants
                </Text>
                <View style={styles.optionsGrid}>
                  {attendeeTypes.map((type) => {
                    const isSelected = filters.attendeeTypeIds.includes(type.id);
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? type.color_hex + '20' : theme.colors.card,
                            borderColor: isSelected ? type.color_hex : theme.colors.border,
                          }
                        ]}
                        onPress={() => toggleAttendeeType(type.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.colorDot, { backgroundColor: type.color_hex }]} />
                        <Text style={[
                          styles.chipText,
                          { color: isSelected ? type.color_hex : theme.colors.text.primary }
                        ]}>
                          {type.name}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={type.color_hex} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Statuts */}
            <View style={[styles.section, { marginBottom: theme.spacing.lg }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Statut
              </Text>
              <View style={styles.optionsGrid}>
                {STATUS_OPTIONS.map((status) => {
                  const isSelected = filters.statuses.includes(status.value);
                  return (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? status.color + '20' : theme.colors.card,
                          borderColor: isSelected ? status.color : theme.colors.border,
                        }
                      ]}
                      onPress={() => toggleStatus(status.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.chipText,
                        { color: isSelected ? status.color : theme.colors.text.primary }
                      ]}>
                        {status.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={status.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Check-in */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Enregistrement
              </Text>
              <View style={styles.optionsGrid}>
                {CHECKIN_OPTIONS.map((option) => {
                  const isSelected = filters.checkedIn === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? theme.colors.brand[100] : theme.colors.card,
                          borderColor: isSelected ? theme.colors.brand[600] : theme.colors.border,
                        }
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, checkedIn: option.value as any }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={option.icon} 
                        size={16} 
                        color={isSelected ? theme.colors.brand[600] : theme.colors.text.secondary} 
                      />
                      <Text style={[
                        styles.chipText,
                        { color: isSelected ? theme.colors.brand[600] : theme.colors.text.primary }
                      ]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.brand[600]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.resetButton,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.secondary }]}>
                Réinitialiser
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.applyButton,
                { backgroundColor: theme.colors.brand[600] }
              ]}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>
                Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    borderWidth: 1,
  },
  applyButton: {
    // backgroundColor applied dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
