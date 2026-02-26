/**
 * PartnerScanDetailScreen - Détail d'un contact scanné
 * Affiche les infos du participant + commentaire éditable + suppression
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  updatePartnerScanCommentThunk,
  deletePartnerScanThunk,
  setCurrentScan,
} from '../../store/partnerScans.slice';
import { partnerScansService } from '../../api/backend/partnerScans.service';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { PartnerScan } from '../../types/partnerScan';
import { Header } from '../../components/ui/Header';

type ParamList = {
  PartnerScanDetail: { scanId: string; eventId: string };
};

type DetailRouteProp = RouteProp<ParamList, 'PartnerScanDetail'>;

export const PartnerScanDetailScreen: React.FC = () => {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();
  const { scanId, eventId } = route.params;
  const { scans, currentScan } = useAppSelector((state) => state.partnerScans);

  const [scan, setScan] = useState<PartnerScan | null>(null);
  const [comment, setComment] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le scan depuis le store ou l'API
  useEffect(() => {
    const existingInStore = scans.find((s) => s.id === scanId);
    if (existingInStore) {
      setScan(existingInStore);
      setComment(existingInStore.comment || '');
      setIsLoading(false);
    } else {
      // Fallback: charger depuis l'API
      loadScanFromApi();
    }
  }, [scanId, scans]);

  const loadScanFromApi = async () => {
    try {
      setIsLoading(true);
      const result = await partnerScansService.getScan(scanId);
      setScan(result);
      setComment(result.comment || '');
    } catch (error) {
      console.error('[PartnerScanDetail] Failed to load scan:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du contact.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveComment = async () => {
    if (!scan) return;
    setIsSaving(true);
    try {
      await dispatch(
        updatePartnerScanCommentThunk({
          id: scan.id,
          comment: comment.trim(),
        })
      ).unwrap();
      setIsEditingComment(false);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le commentaire.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!scan) return;
    Alert.alert(
      'Supprimer ce contact ?',
      'Cette action est irréversible. Le scan sera définitivement supprimé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await dispatch(deletePartnerScanThunk(scan.id)).unwrap();
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de supprimer le contact.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Bouton de suppression comme rightComponent du Header
  const DeleteButton = () => (
    <TouchableOpacity
      style={[styles.deleteButton, { backgroundColor: theme.colors.error[50] }]}
      onPress={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <ActivityIndicator size="small" color={theme.colors.error[500]} />
      ) : (
        <Ionicons name="trash-outline" size={20} color={theme.colors.error[500]} />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Header title="Détail du contact" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        </View>
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <Header title="Détail du contact" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text.secondary }}>Contact non trouvé</Text>
        </View>
      </View>
    );
  }

  const attendee = scan.attendee_data;
  const fullName = `${attendee?.first_name || ''} ${attendee?.last_name || ''}`.trim() || 'Contact';
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header partagé */}
        <Header
          title="Détail du contact"
          onBack={() => navigation.goBack()}
          rightComponent={<DeleteButton />}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact card */}
          <View style={[styles.contactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {/* Avatar + Nom */}
            <View style={styles.contactHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.brand[100] }]}>
                <Text style={[styles.avatarText, { color: theme.colors.brand[600] }]}>
                  {initials}
                </Text>
              </View>
              <Text style={[styles.contactName, { color: theme.colors.text.primary }]}>
                {fullName}
              </Text>
            </View>

            {/* Infos détaillées */}
            <View style={styles.infoSection}>
              {attendee?.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.text.tertiary} />
                  <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                    {attendee.email}
                  </Text>
                </View>
              )}
              {attendee?.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color={theme.colors.text.tertiary} />
                  <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                    {attendee.phone}
                  </Text>
                </View>
              )}
              {attendee?.company && (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={18} color={theme.colors.text.tertiary} />
                  <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                    {attendee.company}
                  </Text>
                </View>
              )}
              {attendee?.job_title && (
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={18} color={theme.colors.text.tertiary} />
                  <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                    {attendee.job_title}
                  </Text>
                </View>
              )}
              {attendee?.country && (
                <View style={styles.infoRow}>
                  <Ionicons name="globe-outline" size={18} color={theme.colors.text.tertiary} />
                  <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                    {attendee.country}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Date du scan */}
          <View style={[styles.metaCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={theme.colors.text.tertiary} />
              <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                Scanné le
              </Text>
            </View>
            <Text style={[styles.dateText, { color: theme.colors.text.primary }]}>
              {formatFullDate(scan.scanned_at)}
            </Text>
          </View>

          {/* Commentaire / Note */}
          <View style={[styles.commentCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.commentHeader}>
              <View style={styles.commentHeaderLeft}>
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.text.tertiary} />
                <Text style={[styles.commentTitle, { color: theme.colors.text.primary }]}>
                  Note
                </Text>
              </View>
              {!isEditingComment && (
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.colors.brand[50] }]}
                  onPress={() => setIsEditingComment(true)}
                >
                  <Ionicons name="pencil" size={16} color={theme.colors.brand[600]} />
                  <Text style={[styles.editButtonText, { color: theme.colors.brand[600] }]}>
                    Modifier
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingComment ? (
              <View style={styles.commentEditContainer}>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.brand[300],
                    },
                  ]}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Ajouter une note sur ce contact..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                    onPress={() => {
                      setComment(scan.comment || '');
                      setIsEditingComment(false);
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.colors.text.secondary }]}>
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.colors.brand[600] }]}
                    onPress={handleSaveComment}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Enregistrer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[
                styles.commentValue,
                { color: comment ? theme.colors.text.primary : theme.colors.text.tertiary }
              ]}>
                {comment || 'Aucune note ajoutée'}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  contactName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  metaCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 28,
  },
  commentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentEditContainer: {
    gap: 12,
  },
  commentInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentValue: {
    fontSize: 14,
    lineHeight: 22,
  },
});

