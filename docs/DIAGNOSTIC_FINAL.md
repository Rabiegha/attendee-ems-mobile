# Diagnostic Final — App Mobile

**Date :** 13 mars 2026  
**Basé sur :** Vérification ligne par ligne du code source actuel  
**Sources croisées :** Diagnostic Auth (5 mars), Diagnostic Chargement Infini, audit du code

---

## Ce qui a été corrigé (pour mémoire, ne pas refaire)

Le commit `9d152a1` du 10 mars a corrigé 5 problèmes :

- `checkAuthThunk` supprimé, remplacé par `restoreSessionThunk` unique
- `useTokenRestoration` n'est plus importé ni appelé nulle part
- `isAuthenticated` retiré de la whitelist redux-persist
- `restoreSessionThunk` a un guard `condition` + `finally` pour reset le flag
- `fetchUserProfileThunk` est appelé dans le flux avant `isAuthenticated = true`

**Ces 5 points sont réellement corrigés dans le code.** Pas besoin d'y revenir.

---

## Problèmes actuels confirmés dans le code

---

### PROBLÈME 1 — Socket reconnecte avec token expiré (CRITIQUE)

**Fichier :** `src/api/socket.service.ts` (L16-40)

**Code actuel :**

```typescript
async connect() {
  const token = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  // Token lu UNE SEULE FOIS ici
  this.socket = io(`${baseUrl}/events`, {
    auth: { token },      // ← Ce token est capturé à la connexion
    reconnection: true,
    reconnectionAttempts: 5,  // ← Réutilise le MÊME token expiré 5 fois
  });
}
```

**Le problème :** Quand le token expire et que socket.io tente une reconnexion automatique, il réutilise le vieux token. Le backend rejette → `connect_error` → retry → même token → 5 tentatives inutiles.

**En plus :** `useSocketSync` appelle `socketService.connect()` quand `isAuthenticated` change, mais `connect()` a un guard `if (this.socket?.connected) return` — si le socket est en cours de reconnexion (pas `connected` mais pas null non plus), il crée un **nouveau** socket sans fermer l'ancien.

**Impact réel :** Features WebSocket cassées après expiration token. Pas de print notifications, pas d'updates temps réel.

---

### PROBLÈME 2 — Listeners socket empilés = notifications en boucle (CRITIQUE)

**Fichier :** `src/api/socket.service.ts` (L65-71 et L58-63)

**Code actuel de `disconnect()` :**

```typescript
disconnect() {
  if (this.socket) {
    this.socket.disconnect();
    this.socket = null;
  }
  // ← La Map `listeners` N'EST PAS vidée
}
```

**Code actuel de `connect()` :**

```typescript
// Écouter tous les événements enregistrés
this.listeners.forEach((callbacks, event) => {
  callbacks.forEach((callback) => {
    this.socket?.on(event, callback); // ← RE-attache TOUT ce qui est dans la Map
  });
});
```

**Le problème :** À chaque cycle disconnect/connect :

1. `disconnect()` met `socket = null` mais garde tous les callbacks dans `listeners`
2. `useSocketSync` et `usePrintJobNotifications` recréent des handlers et les ajoutent via `on()`
3. `connect()` réattache les ANCIENS + NOUVEAUX callbacks
4. Résultat : le même event `print-job:updated` déclenche N handlers → **notification en boucle**

**Preuve dans le code :** `on()` fait `listeners.get(event)?.push(callback)` — jamais de déduplication. `off()` utilise `callbacks.indexOf(callback)` mais si le callback est une nouvelle référence (recréé par `useCallback`), le `indexOf` ne match pas → l'ancien n'est jamais retiré.

**Impact réel :** Notifications d'impression qui apparaissent en boucle après un reconnect.

---

### PROBLÈME 3 — PrintStatusBanner reste affichée infiniment pour SENDING/PENDING/PRINTING (HAUTE)

**Fichier :** `src/components/ui/PrintStatusBanner.tsx` (L124-153)

**Code actuel de l'auto-dismiss :**

```typescript
useEffect(() => {
  if (currentJob) {
    show();
    if (currentJob.status === "COMPLETED") {
      autoDismissTimer.current = setTimeout(() => dismiss(), 3000);
    } else if (currentJob.status === "CLIENT_OFFLINE") {
      autoDismissTimer.current = setTimeout(() => dismiss(), 6000);
    }
    // ← AUCUN timeout pour SENDING, PENDING, PRINTING
  }
}, [currentJob, show, dismiss]);
```

**Le problème :** Si le WebSocket ne reçoit jamais la mise à jour du statut (par exemple parce que le socket est déconnecté — voir Problème 1), la bannière reste affichée en `SENDING` ou `PRINTING` **pour toujours**. Pas de fallback, pas de timeout.

**Impact réel :** Bannière d'impression qui charge infiniment, même si l'impression a déjà réussi/échoué côté serveur.

---

### PROBLÈME 4 — Double refresh token en parallèle : restoreSessionThunk vs intercepteur Axios (HAUTE)

**Fichiers :** `src/store/auth.slice.ts` (L95-163), `src/api/backend/axiosClient.ts` (L140-250)

**Le problème :** Deux systèmes font du token refresh **indépendamment** :

1. **`restoreSessionThunk`** (au retour foreground) : appelle `refreshAccessToken()` si le token est expiré
2. **L'intercepteur de requête Axios** (à chaque appel API) : vérifie l'expiration et appelle aussi `refreshAccessToken()`

**Scénario concret :** L'app revient au foreground →

- `AppContent` dispatch `restoreSessionThunk({ silent: true })` → appelle `refreshAccessToken()`
- En même temps, le socket tente une reconnexion, ou un appel API en arrière-plan passe par l'intercepteur → l'intercepteur voit le token expiré → appelle aussi `refreshAccessToken()`
- Les deux appellent `/auth/refresh` avec le **même refresh token**
- Si le backend fait de la rotation de refresh token (invalide l'ancien au premier usage), le 2ème appel échoue → état incohérent

**Note :** Le flag `isRefreshing` dans `axiosClient.ts` est local à l'intercepteur. `restoreSessionThunk` dans `auth.slice.ts` n'a **aucune connaissance** de ce flag. Ils ne se coordonnent pas.

**Impact réel :** Déconnexion aléatoire au retour foreground, ou token corrompu.

---

### PROBLÈME 5 — Pas de queue dans l'intercepteur de requête (HAUTE)

**Fichier :** `src/api/backend/axiosClient.ts` (L167-197)

**Code actuel :** Quand l'intercepteur de requête détecte qu'un refresh est nécessaire et que `isRefreshing` est déjà `true` :

```typescript
if (!accessToken) {
  const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (refreshToken && !isRefreshing) {
    // ← Si isRefreshing=true, on skip
    isRefreshing = true;
    // ... fait le refresh
  }
  // ← Si isRefreshing=true, la requête continue SANS token
}
```

**Le problème :** L'intercepteur de **réponse** (401) a une `failedQueue` qui met les requêtes en attente pendant un refresh. Mais l'intercepteur de **requête** n'a PAS de queue. Si `isRefreshing = true` quand une nouvelle requête arrive, elle passe **sans Authorization header** → 401 → l'intercepteur de réponse la met dans `failedQueue` → mais si le refresh avait déjà fini entre temps, `failedQueue` n'est jamais vidée pour cette requête.

**Scénario concret :** Les 3 onglets events (Ongoing/Upcoming/Past) montent **simultanément** (Material Top Tabs) et dispatch chacun un `fetchXxxEventsThunk({ page: 1 })`. Les 3 requêtes entrent dans l'intercepteur. La première déclenche le refresh, les deux autres voient `isRefreshing = true` → passent sans token → 401.

**Impact réel :** Un ou deux onglets events restent en chargement infini pendant que le 3ème fonctionne.

---

### PROBLÈME 6 — Guard "Already loading" dans les thunks events ne protège pas correctement (MOYENNE)

**Fichier :** `src/store/events.slice.ts` (L74-76, L111-113, L147-149)

**Code actuel :**

```typescript
export const fetchOngoingEventsThunk = createAsyncThunk(
  "events/fetchOngoingEvents",
  async (params, { rejectWithValue, getState }) => {
    const state = getState() as { events: EventsState };
    if (state.events.ongoing.isLoading && !params?.page) {
      return rejectWithValue("Already loading"); // ← Rejette mais APRÈS que pending ait déjà fire
    }
    // ...
  },
);
```

**Le problème :** Le guard est **dans le body du thunk**, pas dans `condition`. Quand le thunk est dispatché, Redux Toolkit envoie d'abord l'action `.pending` (qui met `isLoading = true`), **puis** exécute le body. Donc :

1. Dispatch → `.pending` → `isLoading = true`
2. Body exécute → `state.events.ongoing.isLoading` est `true` → `rejectWithValue('Already loading')`
3. `.rejected` → `isLoading = false`

Résultat : le guard se déclenche presque **toujours** car `isLoading` vient d'être mis à `true` par `.pending` juste avant. C'est auto-bloquant.

**Impact réel :** Si un appel à `fetchOngoingEventsThunk` est déjà en cours et qu'un second arrive (ex: pull-to-refresh pendant un chargement), le second est rejeté. Mais surtout, le guard peut causer un flash de `isLoading = true` puis `false` sans données.

---

### PROBLÈME 7 — Timeout refresh intercepteur trop court (BASSE)

**Fichier :** `src/api/backend/axiosClient.ts` (L178)

```typescript
const refreshTimeout = setTimeout(() => {
  isRefreshing = false;
}, 10000); // ← 10 secondes
```

Le timeout Axios global est à 30s mais le timeout de sécurité du refresh est à 10s. Sur réseau lent, le refresh peut prendre >10s → timeout fire → `isRefreshing` reset prématurément → la requête part sans token → 401.

---

### PROBLÈME 8 — Code mort non supprimé (BASSE — nettoyage)

Fichiers qui existent toujours mais ne sont importés nulle part :

- `src/hooks/useTokenRestoration.ts` — 197 lignes, jamais importé
- `src/utils/auth.ts` — 59 lignes, jamais importé

Aucun impact fonctionnel mais pollue le projet.

---

### PROBLÈME 9 — Logs excessifs en production (BASSE)

Nombre de `console.log/warn/error` dans les fichiers critiques :

- `axiosClient.ts` : **33** console.log
- `events.slice.ts` : **60** console.log
- `auth.slice.ts` : **29** console.log
- `socket.service.ts` : **10** console.log

Total : **132 logs** juste dans 4 fichiers. Chaque requête API génère 5-10 lignes de log. Avec 3 requêtes events + auth + socket, c'est ~50 lignes de log rien qu'au démarrage. Sur un appareil bas de gamme, ça peut ralentir le bridge React Native.

---

### PROBLÈME 10 — Les écrans events ignorent les erreurs API (MOYENNE)

**Fichiers :** `src/screens/Events/UpcomingEventsScreen.tsx`, `OngoingEventsScreen.tsx`, `PastEventsScreen.tsx`

**Code actuel :** Les 3 écrans destructurent :

```typescript
const { events, isLoading, isLoadingMore, hasMore } = useAppSelector(
  (state) => state.events.upcoming,
);
// ← Le champ `error` existe dans le state mais n'est PAS lu
```

Le state `EventsListState` a bien un champ `error: string | null` qui est rempli par `.rejected` :

```typescript
.addCase(fetchUpcomingEventsThunk.rejected, (state, action) => {
  state.upcoming.isLoading = false;
  state.upcoming.error = (action.payload as any)?.detail || action.error.message || 'Erreur...';
});
```

**Le problème :** Quand une requête échoue (401, timeout, réseau), `isLoading` passe à `false` et `error` est rempli. Mais l'écran ne lit pas `error` → il affiche juste `EmptyState` ("Aucun événement à venir") au lieu d'un message d'erreur avec un bouton "Réessayer".

L'utilisateur voit une liste vide et pense qu'il n'y a pas d'événements, alors qu'en réalité la requête a échoué silencieusement.

**Impact réel :** Masque les erreurs réseau/auth → l'utilisateur ne sait pas qu'il y a un problème et n'a pas de moyen de retry explicite (sauf pull-to-refresh, mais rien ne lui dit de le faire).

---

## Récapitulatif

| #   | Problème                                             | Sévérité     | Impact                                   |
| --- | ---------------------------------------------------- | ------------ | ---------------------------------------- |
| 1   | Socket reconnecte avec token expiré                  | **CRITIQUE** | WebSocket cassé après expiration         |
| 2   | Listeners socket empilés                             | **CRITIQUE** | Notifications en boucle                  |
| 3   | PrintStatusBanner pas de timeout SENDING/PRINTING    | **HAUTE**    | Bannière impression infinie              |
| 4   | Double refresh (restoreSessionThunk vs intercepteur) | **HAUTE**    | Déconnexion aléatoire                    |
| 5   | Pas de queue dans intercepteur de requête            | **HAUTE**    | 1-2 onglets events en chargement infini  |
| 6   | Guard "Already loading" auto-bloquant                | **MOYENNE**  | Flash de chargement inutile              |
| 7   | Timeout refresh 10s trop court                       | **BASSE**    | 401 sur réseau lent                      |
| 8   | Code mort (useTokenRestoration, utils/auth)          | **BASSE**    | Pollution projet                         |
| 9   | 132 console.log dans 4 fichiers                      | **BASSE**    | Lenteur bridge RN                        |
| 10  | Écrans events ignorent le champ `error`              | **MOYENNE**  | Erreurs API masquées → liste vide muette |

---

## Ce qui explique chaque symptôme

**"Événements à venir / passés chargent en boucle infinie"** → Problème 5 (pas de queue intercepteur requête) + Problème 4 (double refresh) + Problème 6 (guard auto-bloquant) + Problème 10 (erreur masquée → l'utilisateur voit une liste vide sans savoir que c'est une erreur)

**"Bannière d'impression charge infiniment"** → Problème 3 (pas de timeout SENDING/PRINTING) + Problème 1 (socket déconnecté donc pas de mise à jour du statut)

**"Notifications en boucle"** → Problème 2 (listeners empilés)

**"Les commandes passent quand même"** → Le premier appel API fonctionne (il a le token). C'est les appels concurrents suivants qui échouent. Le check-in/scan utilise un appel unique, donc il marche. Les events utilisent 3 appels simultanés, donc ça casse.

---

## Ordre de correction recommandé

1. **Problème 2** — Vider `this.listeners` dans `disconnect()` → fix immédiat des notifications en boucle
2. **Problème 1** — Utiliser `auth: { token }` comme factory function ou forcer disconnect+reconnect dans `useSocketSync` → fix WebSocket
3. **Problème 5** — Ajouter une promise queue dans l'intercepteur de requête → fix chargement infini events
4. **Problème 3** — Ajouter un timeout (15-20s) pour SENDING/PENDING/PRINTING dans PrintStatusBanner → fix bannière infinie
5. **Problème 4** — Ajouter un mutex partagé ou vérifier `_isSessionRestoreInProgress` dans l'intercepteur
6. **Problème 10** — Lire `error` du state et afficher un message d'erreur + bouton retry dans les 3 écrans events
7. **Problème 6** — Déplacer le guard dans `condition` de `createAsyncThunk` au lieu du body
8. **Problème 7** — Augmenter timeout de 10s à 25s
9. **Problème 8** — Supprimer les fichiers morts
10. **Problème 9** — Remplacer par un logger conditionnel (`__DEV__`)
