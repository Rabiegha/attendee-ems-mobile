# Diagnostic : Chargements infinis & notifications en boucle après inactivité

## Symptômes observés

- Après ~1h d'inactivité, l'utilisateur reste connecté mais certaines pages (ex: événements à venir) chargent en boucle infinie
- Les notifications d'impression (succès/échec) apparaissent en boucle
- Tout fonctionne normalement à la première connexion

---

## Chronologie du bug (ce qui se passe au retour foreground)

```
App revient au foreground (AppState → 'active')
  │
  ├─ AppContent.tsx  →  dispatch(restoreSessionThunk({ silent: true }))
  │
  └─ useTokenRestoration.ts  →  restoreToken(dispatch, getState)   ← DOUBLON
  │
  ├─ Les deux tentent un refreshAccessToken() en parallèle
  │
  └─ Socket.io est toujours connecté avec l'ANCIEN token expiré
     └─ Reconnection auto avec les mêmes listeners empilés
```

---

## Piste 1 — CRITIQUE : Double restauration de session (race condition)

**Fichiers concernés :**
- `src/AppContent.tsx` (lignes 46-53)
- `src/hooks/useTokenRestoration.ts` (lignes 159-189)

**Problème :**
Deux systèmes indépendants se déclenchent au retour foreground :

1. **AppContent.tsx** : `dispatch(restoreSessionThunk({ silent: true }))`
2. **useTokenRestoration.ts** : `restoreToken()` via `AppState.addEventListener`

Les deux font `AppState 'active'` → `refreshAccessToken()`. Le garde `_isSessionRestoreInProgress` dans `restoreSessionThunk` ne protège PAS contre `useTokenRestoration` qui fait son propre appel direct.

**Conséquences :**
- Deux appels `/auth/refresh` simultanés avec le même refresh token
- Si le backend invalide le refresh token au premier usage (rotation), le second échoue → logout implicite ou token corrompu
- Le flag `isRefreshing` global dans `axiosClient.ts` ne synchronise pas les deux chemins
- `useTokenRestoration` ajoute un délai artificiel de 300ms (ligne 179), aggravant la fenêtre de race condition

**Test à faire :**
Commenter entièrement l'appel à `useTokenRestoration` (il est redondant avec `restoreSessionThunk`) et vérifier si le problème disparaît.

---

## Piste 2 — CRITIQUE : Socket.io reconnecte avec un token expiré

**Fichier concerné :** `src/api/socket.service.ts` (lignes 14-40)

**Problème :**

```typescript
async connect() {
  const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  // ← Token lu UNE SEULE FOIS, jamais rafraîchi après
  this.socket = io(`${baseUrl}/events`, {
    auth: { token },
    reconnection: true,           // ← Auto-reconnection activée
    reconnectionAttempts: 5,      // ← 5 tentatives avec le même vieux token
  });
}
```

- Le token est capturé à la connexion initiale et **jamais mis à jour**
- Quand socket.io se reconnecte après un timeout, il réutilise le même token expiré
- Le backend rejette la connexion → `connect_error` → retry → même token → boucle
- La reconnection auto de socket.io n'est pas coordonnée avec le refresh du token

De plus, `useSocketSync` (ligne 18-23) fait `socketService.connect()` quand `isAuthenticated` passe à `true`, mais `connect()` vérifie `if (this.socket?.connected)` — si la socket est en cours de reconnection (pas totalement déconnectée), elle ne se reconnecte pas avec le nouveau token.

**Test à faire :**
Dans `useSocketSync`, faire `socketService.disconnect()` PUIS `socketService.connect()` au lieu de juste `connect()` quand l'app revient au foreground. Ou modifier `connect()` pour toujours lire un token frais et forcer une nouvelle connexion.

---

## Piste 3 — HAUTE : Listeners socket empilés = notifications en boucle

**Fichier concerné :** `src/api/socket.service.ts` (lignes 58-81)

**Problème :**

La méthode `on()` ajoute les callbacks dans une Map interne :

```typescript
on(event: string, callback: (...args: any[]) => void) {
  this.listeners.get(event)?.push(callback);  // ← AJOUT à chaque appel
  if (this.socket?.connected) {
    this.socket.on(event, callback);           // ← Aussi attaché au socket
  }
}
```

Et dans `connect()`, tous les listeners stockés sont réattachés :

```typescript
this.listeners.forEach((callbacks, event) => {
  callbacks.forEach(callback => {
    this.socket?.on(event, callback);  // ← RE-attache TOUS les listeners
  });
});
```

Mais `disconnect()` **ne vide pas la Map `listeners`**. Donc à chaque cycle disconnect/connect :
1. Les anciens callbacks restent dans la Map
2. `usePrintJobNotifications` se re-subscribe → ajoute un NOUVEAU callback
3. Au `connect()`, les anciens ET nouveaux sont réattachés
4. Le même événement `print-job:updated` déclenche N handlers → **notification en boucle**

De plus, `usePrintJobNotifications` recrée `handlePrintJobUpdated` via `useCallback` à chaque render, donc le `off()` dans le cleanup peut ne pas matcher l'ancienne référence.

**Test à faire :**
Ajouter un log dans `handlePrintJobUpdated` pour compter combien de fois il est appelé par notification. Si > 1, c'est confirmé.

---

## Piste 4 — MOYENNE : `isAuthenticated` oscille → re-renders en cascade

**Fichiers concernés :**
- `src/store/auth.slice.ts` (lignes 289-305)
- `src/screens/Events/UpcomingEventsScreen.tsx`

**Problème :**

Le flow dans le reducer :

```
restoreSessionThunk.pending     → isRestoringAuth = true (isAuthenticated inchangé)
restoreSessionThunk.fulfilled   → isAuthenticated = true, isRestoringAuth = false
restoreSessionThunk.rejected    → si silent: inchangé, sinon: isAuthenticated = false
```

Scénario problématique :
1. `redux-persist` rehydrate `user` + `organization` → `isAuthenticated` reste `false` (pas persisté)
2. `restoreSessionThunk()` se lance → `pending`
3. `fetchUpcomingEventsThunk` dans `UpcomingEventsScreen` se lance avec `isAuthenticated = false` mais un token expiré en mémoire → l'intercepteur tente un refresh
4. `restoreSessionThunk()` fait aussi un refresh → race condition
5. Si ça échoue → `isAuthenticated = false` → `useSocketSync` fait `disconnect()` → puis retry → `connect()` → listeners empilés encore

**Le chargement infini des events** vient probablement du fait que `fetchUpcomingEventsThunk` est appelé, le token est expiré, l'intercepteur tente un refresh qui est déjà en cours → la requête est mise en queue (`failedQueue`) → si le refresh échoue → la requête ne se résout jamais → **spinner infini**.

**Test à faire :**
Ajouter dans `UpcomingEventsScreen` un guard `if (!isAuthenticated) return` avant le dispatch de `fetchUpcomingEventsThunk`.

---

## Piste 5 — MOYENNE : `isRefreshing` bloqué à `true` (deadlock)

**Fichier concerné :** `src/api/backend/axiosClient.ts`

**Problème :**

Le request interceptor et le response interceptor (401) utilisent tous les deux le même flag `isRefreshing` :

```typescript
// Request interceptor
isRefreshing = true;
try { await refreshAccessToken(); }
finally { isRefreshing = false; }

// Response interceptor (401)
isRefreshing = true;
try { await refreshAccessToken(); }
finally { ... }
```

Si les deux paths se déclenchent quasi-simultanément (ce qui arrive au retour foreground quand `useTokenRestoration` ET `restoreSessionThunk` ET un fetch automatique s'exécutent), `isRefreshing` peut rester bloqué à `true`, et toutes les requêtes suivantes entrent dans `failedQueue` **sans jamais être résolues**.

Il y a un timeout de sécurité de 10s (`refreshTimeout`), mais uniquement dans le request interceptor, pas dans le response interceptor.

**Test à faire :**
Ajouter un log `console.log('[axiosClient] isRefreshing =', isRefreshing)` au début de chaque requête pour vérifier s'il reste bloqué à `true`.

---

## Résumé

| # | Piste | Sévérité | Symptôme expliqué |
|---|-------|----------|-------------------|
| 1 | Double restauration (useTokenRestoration + restoreSessionThunk) | **CRITIQUE** | Race condition → token corrompu / refresh échoue |
| 2 | Socket reconnecte avec token expiré | **CRITIQUE** | Features temps réel cassées |
| 3 | Listeners socket empilés | **HAUTE** | Notifications en boucle |
| 4 | `isAuthenticated` oscille | **MOYENNE** | Chargement infini des events |
| 5 | `isRefreshing` deadlock | **MOYENNE** | Toutes les requêtes API bloquées |

---

## Premier test recommandé

Le plus impactant : **désactiver `useTokenRestoration`** (commenter l'appel dans `App.tsx`) et observer si les deux symptômes (chargement infini + notifications en boucle) disparaissent. Cela confirmerait que la race condition est la cause racine, et que `restoreSessionThunk` suffit à lui seul.
