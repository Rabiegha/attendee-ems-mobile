# Diagnostic Auth — Mobile App

**Date :** 5 mars 2026

## Résumé

Analyse complète du flux d'authentification de l'app mobile. Plusieurs problèmes identifiés pouvant causer des comportements bizarres (écrans vides, déconnexions inattendues, données obsolètes).

---

## Problèmes identifiés

### 1. Race condition au démarrage (CRITIQUE)

**Fichiers :** `src/navigation/AppNavigator.tsx` (L77), `src/hooks/useTokenRestoration.ts`

Il y a **2 systèmes parallèles** qui restaurent l'auth au lancement :

- `AppNavigator` → `checkAuthThunk()` qui vérifie juste si un refresh token **existe** (booléen)
- `AppContent` → `useTokenRestoration()` qui fait le vrai refresh + charge le profil

**Problème :** `checkAuthThunk` met `isAuthenticated = true` dès qu'un refresh token existe en storage, **avant** que `useTokenRestoration` ait eu le temps de rafraîchir le token. L'utilisateur est redirigé vers l'app, mais le `accessToken` en mémoire est `null` → les premiers appels API échouent en 401.

**Symptôme :** Écran vide ou erreurs au lancement, puis ça marche après quelques secondes.

---

### 2. Désynchronisation Redux-Persist vs tokens réels (CRITIQUE)

**Fichiers :** `src/store/index.ts` (L21-24), `src/api/backend/axiosClient.ts` (L45)

Le store auth est persisté via AsyncStorage avec `whitelist: ['user', 'organization', 'isAuthenticated']`.

**Problème :** Au redémarrage de l'app :
1. Redux-persist restaure `isAuthenticated = true` + `user` + `organization` **instantanément**
2. L'app affiche l'écran authentifié
3. MAIS le `accessToken` en mémoire est `null` (la variable `let accessToken` dans axiosClient n'est pas persistée)
4. L'intercepteur de requête essaie de restaurer depuis SecureStore → si le token est expiré, il tente un refresh
5. Pendant ce temps, les requêtes partent sans token → 401

**Symptôme :** Après avoir fermé et rouvert l'app, l'utilisateur voit brièvement les données puis tout plante ou les données disparaissent.

---

### 3. Flag `isRestoring` global jamais reset en cas de crash (MOYEN)

**Fichier :** `src/hooks/useTokenRestoration.ts` (L17)

Le flag `isRestoring` est un **module global** :

```typescript
let isRestoring = false;
```

Si la restauration crashe de manière inattendue (ex: l'app est tuée pendant le refresh), ce flag peut rester à `true` au prochain cycle, bloquant toute restauration.

**Symptôme :** L'utilisateur reste bloqué sur l'écran de login alors qu'il a un refresh token valide.

---

### 4. `checkAuthThunk` ne vérifie pas la validité du token (MOYEN)

**Fichier :** `src/api/backend/auth.service.ts` (L157-163)

```typescript
async isAuthenticated(): Promise<boolean> {
    const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return !!refreshToken; // Vérifie juste qu'il existe, pas qu'il est valide
}
```

Un refresh token **révoqué côté serveur** mais toujours en storage → l'app pense être authentifiée, redirige vers les events, puis tous les appels API échouent.

**Symptôme :** L'utilisateur est connecté mais ne peut rien faire, toutes les pages sont vides.

---

### 5. Pas de `fetchUserProfileThunk` après le login initial dans `checkAuthThunk` (MOYEN)

**Fichiers :** `src/store/auth.slice.ts` (L72-86)

`checkAuthThunk` met `isAuthenticated = true` mais **ne charge pas le profil utilisateur**. C'est `useTokenRestoration` qui s'en charge séparément. Si ce hook ne s'exécute pas ou échoue silencieusement, `state.auth.user` dépend uniquement du cache redux-persist (qui peut être obsolète).

**Symptôme :** Le rôle ou les permissions de l'utilisateur sont incorrects après un changement côté admin.

---

### 6. Double décodage JWT redondant (MINEUR)

**Fichiers :** `src/api/backend/auth.service.ts` (L14), `src/utils/auth.ts` (L7)

`decodeJwtPayload` est défini dans `auth.service.ts` ET `decodeJWT` dans `utils/auth.ts`. Les deux font la même chose. De plus, `isTokenExpired` / `isTokenExpiringSoon` de `utils/auth.ts` **ne sont utilisés nulle part** — le check d'expiration est fait manuellement dans `axiosClient.ts`.

---

### 7. Timeout de sécurité trop court (MINEUR)

**Fichier :** `src/api/backend/axiosClient.ts` (L186)

Le timeout du refresh dans l'intercepteur de requête est de **10 secondes**. Sur un réseau mobile lent (3G, zones rurales), ça peut expirer avant la réponse, laissant `isRefreshing = true` bloqué alors que le refresh réussit côté serveur.

---

## Tableau récapitulatif

| # | Problème | Sévérité | Symptôme probable |
|---|---|---|---|
| 1 | Race condition `checkAuthThunk` vs `useTokenRestoration` | **CRITIQUE** | Écran vide au lancement / erreurs 401 |
| 2 | Redux-persist restaure `isAuthenticated` sans token valide | **CRITIQUE** | App "connectée" mais rien ne marche |
| 3 | Flag `isRestoring` jamais reset si crash | MOYEN | Bloqué sur login |
| 4 | `isAuthenticated()` ne vérifie pas la validité | MOYEN | Connecté mais tout vide |
| 5 | Pas de `fetchUserProfile` dans `checkAuthThunk` | MOYEN | Rôle/permissions obsolètes |
| 6 | Double décodage JWT | MINEUR | Code mort |
| 7 | Timeout refresh trop court | MINEUR | Blocage réseau lent |

---

## Flux actuel (simplifié)

```
App Launch
├── Redux-Persist → restaure isAuthenticated=true, user, organization (instantané)
├── AppNavigator → checkAuthThunk() → refreshToken existe ? → isAuthenticated=true
│   └── Redirige vers Events (SANS token en mémoire)
└── AppContent → useTokenRestoration()
    └── refresh token → setAuthTokens() → fetchUserProfile() (ASYNC, peut arriver après)

Résultat: Les premiers appels API partent sans accessToken → 401
```

## Recommandations

1. **Fusionner** `checkAuthThunk` et `useTokenRestoration` en un seul flux séquentiel
2. **Ne pas mettre `isAuthenticated = true`** tant que le token n'est pas effectivement restauré en mémoire
3. Ajouter un **état "restoring"** dans le store auth pour afficher un splash/loader pendant la restauration
4. Utiliser les utilitaires `isTokenExpired` de `utils/auth.ts` (ou les supprimer)
5. Augmenter le timeout de refresh à 20-30s pour les réseaux lents
