/**
 * Écran Sessions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { SearchBar } from '../../components/ui/SearchBar';
import { Card } from '../../components/ui/Card';
import { useAppSelector } from '../../store/hooks';
import { SessionsService } from '../../api/backend/sessions.service';
import { Session } from '../../types/session';

export const SessionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { currentEvent } = useAppSelector((state) => state.events);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!currentEvent?.id) return;
    
    try {
      setError(null);
      const data = await SessionsService.getSessions(currentEvent.id);
      setSessions(data);
    } catch (err) {
      console.error('[SessionsScreen] Error fetching sessions:', err);
      setError('Impossible de charger les sessions');
    }
  }, [currentEvent?.id]);

  useEffect(() => {
    setIsLoading(true);
    fetchSessions().finally(() => setIsLoading(false));
  }, [fetchSessions]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessions();
    setIsRefreshing(false);
  };

  const handleScanSession = (session: Session) => {
    if (!currentEvent?.id) return;
    
    navigation.navigate('Scan', { 
        eventId: currentEvent.id, 
        sessionId: session.id,
        sessionName: session.name
    });
  };

  const filteredSessions = sessions.filter(session => 
    session.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (session.location && session.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatTime = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ padding: theme.spacing.lg }}>
        {/* Barre de recherche */}
        <SearchBar
          placeholder="Rechercher une session..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ marginBottom: theme.spacing.sm }}
        />
      </View>

      <ScrollView 
        contentContainerStyle={{ 
          paddingHorizontal: theme.spacing.lg, 
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.colors.brand[600]]} />
        }
      >
        {filteredSessions.length === 0 ? (
          <Card>
            <Text 
              style={{ 
                fontSize: theme.fontSize.base, 
                color: theme.colors.text.secondary,
                textAlign: 'center',
                padding: theme.spacing.lg
              }}
            >
              {error ? error : (searchQuery ? 'Aucune session trouvée' : 'Aucune session pour cet événement')}
            </Text>
            {error && (
                <TouchableOpacity onPress={() => fetchSessions()} style={{ marginTop: 10, alignSelf: 'center' }}>
                    <Text style={{ color: theme.colors.brand[600] }}>Réessayer</Text>
                </TouchableOpacity>
            )}
          </Card>
        ) : (
            filteredSessions.map((session) => (
                <View key={session.id} style={[styles.sessionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <TouchableOpacity 
                        style={styles.sessionHeader} 
                        onPress={() => navigation.navigate('SessionDetails', { 
                            eventId: currentEvent?.id, 
                            sessionId: session.id,
                            sessionName: session.name
                        })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sessionName, { color: theme.colors.text.primary }]}>{session.name}</Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
                                <Text style={[styles.metaText, { color: theme.colors.text.tertiary }]}>
                                    {formatDate(session.start_at)} • {formatTime(session.start_at)} - {formatTime(session.end_at)}
                                </Text>
                            </View>
                            {session.location && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="location-outline" size={14} color={theme.colors.text.tertiary} />
                                    <Text style={[styles.metaText, { color: theme.colors.text.tertiary }]}>
                                        {session.location}
                                    </Text>
                                </View>
                            )}
                             {session.capacity && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="people-outline" size={14} color={theme.colors.text.tertiary} />
                                    <Text style={[styles.metaText, { color: theme.colors.text.tertiary }]}>
                                        Capacité: {session.capacity}
                                    </Text>
                                </View>
                            )}
                             {session.allowedAttendeeTypes.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: theme.colors.warning[100] }]}>
                                    <Text style={{ fontSize: 10, color: theme.colors.warning[800] }}>Accès restreint</Text>
                                </View>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                    
                    <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
                    
                    <TouchableOpacity 
                        style={[styles.scanButton, { backgroundColor: theme.colors.brand[50] }]}
                        onPress={() => handleScanSession(session)}
                    >
                        <Ionicons name="qr-code-outline" size={20} color={theme.colors.brand[600]} />
                        <Text style={[styles.scanButtonText, { color: theme.colors.brand[600] }]}>Scanner</Text>
                    </TouchableOpacity>
                </View>
            ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sessionHeader: {
    padding: 16,
    flexDirection: 'row',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  scanButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  }
});
