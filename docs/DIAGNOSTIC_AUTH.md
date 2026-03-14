# Diagnostic Auth — Mobile App

**Date :** 5 mars 2026  
**Dernière mise à jour :** 13 mars 2026

## Résumé

Analyse complète du flux d'authentification de l'app mobile. Plusieurs problèmes critiques ont été **corrigés** depuis le diagnostic initial. Ce document trace l'état actuel et les problèmes résiduels.

---

## Corrections appliquées depuis le 5 mars

### ✅ FIX 1 : Race condition au démarrage — CORRIGÉ

**Problème initial :** Deux systèmes parallèles (`checkAuthThunk` + `useTokenRestoration`) restauraient l'auth au lancement, causant des 401.

**Correction :** `checkAuthThunk` a été **supprimé**. Un nouveau `restoreSessionThunk` unique dans `auth.slice.ts` centralise tout le flux. `AppContent.tsx` l'appelle une seule fois au montage :

```typescript
// AppContent.tsx — Point d'entrée UNIQUE
useEffect(() => {
  dispatch(restoreSessionThunk());
}, [dispatch]);
```

Le flux est maintenant séquentiel : refresh token → access token → fetchUserProfile → `isAuthenticated = true`.

**Statut : ✅ RÉSOLU**

---

### ✅ FIX 2 : Désynchronisation Redux-Persist vs tokens réels — CORRIGÉ

**Problème initial :** Redux-persist restaurait `isAuthenticated = true` instantanément, avant que le token soit en mémoire.

**Correction :** `isAuthenticated` a été **retiré de la whitelist** de persistence. Seuls `user` et `organization` sont persistés (pour affichage cache) :

```typescript
// store/index.ts
const authPersistConfig = {
  key: "auth",
  storage: AsyncStorage,
  whitelist: ["user", "organization"], // Ne PAS persister isAuthenticated
};
```

Au redémarrage, `isAuthenticated` démarre à `false`. `AppNavigator` affiche un splash loader (`isRestoringAuth = true`) pendant que `restoreSessionThunk` fait son travail. `isAuthenticated` ne passe à `true` qu'après que `fetchUserProfileThunk` ait réussi.

**Statut : ✅ RÉSOLU**

---

### ✅ FIX 3 : Flag `isRestoring` jamais reset — CORRIGÉ

**Problème initial :** Le flag global `isRestoring` dans `useTokenRestoration.ts` pouvait rester bloqué.

**Correction :** `useTokenRestoration` n'est **plus utilisé ni importé** nulle part (code mort). Le nouveau `restoreSessionThunk` utilise un guard `_isSessionRestoreInProgress` avec :

- Un `finally` block qui le reset systématiquement
- Un `condition` callback de `createAsyncThunk` qui empêche les appels concurrents

```typescript
// auth.slice.ts
{
  condition: () => {
    if (_isSessionRestoreInProgress) return false;
    return true;
  };
}
```

**Statut : ✅ RÉSOLU**

---

### ✅ FIX 4 : `checkAuthThunk` ne vérifie pas la validité — CORRIGÉ

**Problème initial :** `checkAuthThunk` acceptait tout refresh token sans vérifier sa validité.

**Correction :** `checkAuthThunk` a été supprimé. `restoreSessionThunk` tente **réellement** un refresh ou une restauration du token, puis charge le profil. Si le refresh token est révoqué côté serveur, `refreshAccessToken()` échoue → `restoreSessionThunk.rejected` → `isAuthenticated = false` → redirection vers login.

**Statut : ✅ RÉSOLU**

---

### ✅ FIX 5 : Pas de `fetchUserProfile` dans le flux d'auth — CORRIGÉ

**Problème initial :** `checkAuthThunk` ne chargeait pas le profil utilisateur.

**Correction :** `restoreSessionThunk` appelle `fetchUserProfileThunk()` en étape 4, après le token refresh. Le profil frais (rôle, permissions) est chargé **avant** que `isAuthenticated` passe à `true`.

**Statut : ✅ RÉSOLU**

---

## Problèmes résiduels

### 🟡 6. Double décodage JWT redondant (MINEUR — code mort)

**Fichiers :** `src/api/backend/auth.service.ts`, `src/utils/auth.ts`

- `decodeJwtPayload` dans `auth.service.ts` — **utilisé** (pour extraire les permissions dans `fetchUserProfileThunk`)
- `decodeJWT` + `isTokenExpired` + `isTokenExpiringSoon` + `getTokenExpiration` + `calculateExpiresAt` dans `utils/auth.ts` — **jamais importés nulle part**, code 100% mort

**Recommandation :** Supprimer `src/utils/auth.ts` entièrement.

---

### 🟡 7. Timeout de sécurité refresh trop court dans l'intercepteur (MINEUR)

**Fichier :** `src/api/backend/axiosClient.ts` (L176)

Le timeout du refresh dans l'intercepteur de requête est toujours à **10 secondes** :

```typescript
const refreshTimeout = setTimeout(() => {
  console.warn("[axiosClient] ⚠️ Refresh timeout, resetting flag");
  isRefreshing = false;
}, 10000);
```

Sur réseau lent (3G, zones rurales), le refresh peut prendre >10s → le timeout fire → `isRefreshing` reset → la requête part sans token → 401. En parallèle, la réponse du refresh arrive après et met à jour le token → état incohérent.

**Recommandation :** Augmenter à 20-30s ou aligner sur le timeout Axios global (30s).

---

### 🟡 8. `useTokenRestoration.ts` est du code mort (MINEUR — nettoyage)

**Fichier :** `src/hooks/useTokenRestoration.ts`

Ce fichier de 197 lignes n'est **plus importé nulle part** depuis l'introduction de `restoreSessionThunk`. Il est toujours exporté dans `src/hooks/index.ts` de manière implicite mais jamais consommé.

**Recommandation :** Supprimer le fichier.

---

### 🟠 9. Double refresh parallèle : `restoreSessionThunk` vs intercepteur Axios (MOYEN — NOUVEAU)

**Fichiers :** `src/store/auth.slice.ts`, `src/api/backend/axiosClient.ts`

Deux systèmes font du token refresh de manière **indépendante** :

1. **`restoreSessionThunk`** (au boot + retour foreground) : appelle `refreshAccessToken()` si le token est expiré
2. **L'intercepteur de requête Axios** (à chaque appel API) : vérifie l'expiration et appelle `refreshAccessToken()` si nécessaire

**Scénario problématique :** Au retour foreground, `restoreSessionThunk({ silent: true })` lance un refresh. En même temps, un appel API en cours (WebSocket reconnect, etc.) déclenche aussi un refresh via l'intercepteur. Les deux appellent `/auth/refresh` quasi-simultanément avec le **même refresh token** → le backend génère un nouveau refresh token pour le premier appel → le deuxième échoue car l'ancien refresh token est invalidé.

**Impact :** Déconnexion aléatoire au retour foreground.

**Recommandation :** Ajouter un mutex partagé entre `restoreSessionThunk` et l'intercepteur, ou faire en sorte que l'intercepteur n'essaie pas de refresh si `restoreSessionThunk` est déjà en cours.

---

### 🟠 10. Requêtes events concurrentes pendant la restauration (MOYEN — NOUVEAU)

**Fichiers :** `src/screens/Events/UpcomingEventsScreen.tsx`, `src/screens/Events/PastEventsScreen.tsx`, `src/screens/Events/OngoingEventsScreen.tsx`

Dès que `isAuthenticated` passe à `true`, `AppNavigator` rend `EventsNavigator` → `EventsListScreen` (Material Top Tabs) → **les 3 onglets montent simultanément** et chacun dispatch un `fetchXxxEventsThunk({ page: 1 })`.

Ces 3 requêtes passent toutes par l'intercepteur Axios qui fait pour chacune :

1. Lire SecureStorage (async)
2. Vérifier expiration
3. Potentiellement await `refreshAccessToken()`

Si le token vient d'être rafraîchi mais que `shouldRefresh` est encore `true` (token < 60s — le `TOKEN_REFRESH_THRESHOLD`), les 3 requêtes déclenchent chacune un check de refresh → seule la première passe, les autres voient `isRefreshing = true` mais il n'y a **pas de queue** dans l'intercepteur de requête (la queue n'existe que dans l'intercepteur de réponse pour les 401).

**Impact :** Certaines requêtes passent sans header Authorization → 401 → chargement infini sur un ou deux onglets.

**Recommandation :** Ajouter une file d'attente (promise queue) dans l'intercepteur de requête, similaire à `failedQueue` dans l'intercepteur de réponse.

---

## Tableau récapitulatif (mis à jour)

| #   | Problème                                                 | Sévérité     | Statut         |
| --- | -------------------------------------------------------- | ------------ | -------------- |
| 1   | Race condition `checkAuthThunk` vs `useTokenRestoration` | **CRITIQUE** | ✅ Corrigé     |
| 2   | Redux-persist restaure `isAuthenticated` sans token      | **CRITIQUE** | ✅ Corrigé     |
| 3   | Flag `isRestoring` jamais reset si crash                 | MOYEN        | ✅ Corrigé     |
| 4   | `isAuthenticated()` ne vérifie pas la validité           | MOYEN        | ✅ Corrigé     |
| 5   | Pas de `fetchUserProfile` dans le flux d'auth            | MOYEN        | ✅ Corrigé     |
| 6   | Double décodage JWT / code mort `utils/auth.ts`          | MINEUR       | 🟡 À nettoyer  |
| 7   | Timeout refresh intercepteur trop court (10s)            | MINEUR       | 🟡 À corriger  |
| 8   | `useTokenRestoration.ts` code mort (197 lignes)          | MINEUR       | 🟡 À supprimer |
| 9   | Double refresh parallèle (thunk vs intercepteur)         | MOYEN        | 🟠 Nouveau     |
| 10  | 3 requêtes events concurrentes sans queue intercepteur   | MOYEN        | 🟠 Nouveau     |

---

## Flux actuel (mis à jour — 13 mars 2026)

```
App Launch
├── Redux-Persist → restaure user + organization (cache affichage)
│   └── isAuthenticated = false (non persisté)
│
├── AppNavigator → voit isRestoringAuth=true → affiche Splash Loader
│
└── AppContent → dispatch(restoreSessionThunk())
    ├── 1. Vérifie refresh token en SecureStore
    ├── 2. Restaure access token depuis storage (si >5min restantes)
    │   └── Sinon → await refreshAccessToken() via /auth/refresh
    ├── 3. await fetchUserProfileThunk() → charge profil frais
    └── 4. fulfilled → isAuthenticated=true, isRestoringAuth=false
        └── AppNavigator → rend EventsNavigator
            └── 3 onglets montent → 3 requêtes /events en parallèle ← ⚠️ Pb #10

Retour Foreground:
└── AppContent → dispatch(restoreSessionThunk({ silent: true }))
    └── Même flux mais sans splash (silent=true)
    └── ⚠️ Pb #9 : peut conflater avec un refresh de l'intercepteur
```

## Recommandations restantes

1. **Supprimer** `src/utils/auth.ts` (code mort)
2. **Supprimer** `src/hooks/useTokenRestoration.ts` (code mort, 197 lignes)
3. **Augmenter** le timeout refresh intercepteur de 10s → 25s
4. **Ajouter un mutex partagé** entre `restoreSessionThunk` et l'intercepteur Axios pour éviter les double refresh
5. **Ajouter une promise queue** dans l'intercepteur de requête pour sérialiser les requêtes pendant un refresh en cours (comme `failedQueue` existe déjà pour les 401 dans l'intercepteur de réponse)
