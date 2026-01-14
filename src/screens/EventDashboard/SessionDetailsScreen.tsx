/**
 * Écran Détails Session
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui/Card';
import { SessionsService } from '../../api/backend/sessions.service';
import { Button } from '../../components/ui/Button';

export const SessionDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { eventId, sessionId, sessionName } = route.params;
  
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchHistory = useCallback(async () => {
    if (!eventId || !sessionId) return;
    
    try {
      const data = await SessionsService.getSessionHistory(eventId, sessionId);
      setHistory(data);
    } catch (err) {
      console.error('[SessionDetailsScreen] Error fetching history:', err);
    }
  }, [eventId, sessionId]);

  useEffect(() => {
    setIsLoading(true);
    fetchHistory().finally(() => setIsLoading(false));
  }, [fetchHistory]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  };

  const handleScan = () => {
    navigation.navigate('Scan', { 
        eventId, 
        sessionId,
        sessionName
    });
  };

  const renderItem = ({ item }: { item: any }) => {
      const attendee = item.registration.attendee;
      const isEnter = item.scan_type === 'IN';
      
      return (
        <Card style={{ marginBottom: theme.spacing.sm, padding: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
                <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: theme.colors.text.primary 
                }}>
                    {attendee.first_name} {attendee.last_name}
                </Text>
                <Text style={{ 
                    fontSize: 14, 
                    color: theme.colors.text.secondary,
                    marginTop: 2
                }}>
                    {attendee.company || attendee.email}
                </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: isEnter ? theme.colors.success[100] : theme.colors.error[100],
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginBottom: 4
                }}>
                    <Ionicons 
                        name={isEnter ? "arrow-forward-circle" : "arrow-back-circle"} 
                        size={16} 
                        color={isEnter ? theme.colors.success[700] : theme.colors.error[700]} 
                        style={{ marginRight: 4 }}
                    />
                    <Text style={{ 
                        fontSize: 12, 
                        fontWeight: 'bold',
                        color: isEnter ? theme.colors.success[700] : theme.colors.error[700]
                    }}>
                        {isEnter ? 'ENTRÉE' : 'SORTIE'}
                    </Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>
                    {new Date(item.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
          </View>
        </Card>
      );
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
            <Button
                title="Scanner un participant"
                onPress={handleScan}
                icon="qr-code-outline"
            />
        </View>

        <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 20 }}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
                <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.text.tertiary }}>Aucun historique de scan</Text>
                </View>
            }
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
