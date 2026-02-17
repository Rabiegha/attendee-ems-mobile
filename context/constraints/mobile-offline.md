# Contraintes Mobile — Offline & Sync

## Scope
- mobile/offline
- mobile/*

## Purpose
Règles et architecture du mode offline de l'app mobile.
Le mobile doit fonctionner en mode dégradé sans réseau et synchroniser ensuite.

## Rules

### Principes offline

1. **Offline-first pour le check-in** : le scan de badge fonctionne sans réseau.
2. **Cache local** : les données consultées récemment sont disponibles offline.
3. **Queue de sync** : les actions offline sont mises en file et rejouées à la reconnexion.
4. **Conflit résolu côté serveur** : en cas de doublon check-in, l'API est idempotente (timestamp le plus ancien gagne).

### Stockage local

| Donnée | Stockage | Chiffrée |
|--------|----------|----------|
| Access token | Expo SecureStore | ✅ (OS-level) |
| Refresh token | Expo SecureStore | ✅ (OS-level) |
| Liste participants (cache) | AsyncStorage ou SQLite | ❌ (données non sensibles) |
| Queue de check-in offline | AsyncStorage | ❌ |
| Préférences utilisateur | AsyncStorage | ❌ |

### Sync workflow

```
1. Action offline (ex: check-in)
   └─→ Sauvegarde dans la queue locale (AsyncStorage)

2. Détection de reconnexion (NetInfo)
   └─→ Lecture de la queue
   └─→ Replay séquentiel des actions vers l'API

3. Pour chaque action :
   ├─ Succès (200/201) → retirer de la queue
   ├─ Conflit (409) → retirer de la queue (déjà traité)
   └─ Erreur serveur (5xx) → garder dans la queue, retry plus tard

4. Notifier l'utilisateur du résultat de la sync
```

### Détection réseau

- Utiliser `@react-native-community/netinfo` pour détecter l'état réseau.
- Ne pas se fier uniquement à `isConnected` — vérifier `isInternetReachable`.
- Afficher un indicateur visuel quand l'app est en mode offline.

### Limites du mode offline

- **Lecture seule** : seuls les check-ins sont possibles offline (pas de création de participant).
- **Données en cache** : les listes de participants sont celles du dernier fetch réussi.
- **Expiration** : le cache local est invaldiable marqué "stale" après 24h sans sync.

## Code
- Service offline : `src/services/offline/`
- Queue sync : `src/services/sync/`
- NetInfo hook : `src/hooks/useNetworkStatus.ts`
- Storage : `src/services/storage/`
