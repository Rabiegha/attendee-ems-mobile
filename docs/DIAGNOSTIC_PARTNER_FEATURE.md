# DIAGNOSTIC COMPLET — Feature Partner Scan Mobile

> Date : 25 février 2026  
> Branche : `Partner-scan`  
> Auteur : Audit automatisé

---

## 1. BUGS & ERREURS IDENTIFIÉS

### BUG CRITIQUE (corrigé) — Mapping du rôle après token refresh

- **Fichier** : `src/store/auth.slice.ts` (lignes 82-130)
- **Problème** : `fetchUserProfileThunk` écrivait le payload brut de `/users/me` dans `state.user`. Le backend retourne `role` comme un objet Prisma `{id, code, name...}`, pas comme la string `'PARTNER'`. Après un refresh, `userRole === 'PARTNER'` → `false` → navigation vers `EventInner` au lieu de `PartnerInner`.
- **Statut** : ✅ Corrigé — le thunk mappe maintenant `role.code` en string.

---

### BUG — `clearPartnerScans` importé mais jamais appelé

- **Fichier** : `src/screens/Partner/PartnerListScreen.tsx` (ligne 22)
- **Problème** : `clearPartnerScans` est importé mais jamais utilisé. Plus grave : **quand on change d'événement, les scans de l'ancien événement restent affichés** brièvement avant le rechargement. Il faudrait appeler `clearPartnerScans()` dans un cleanup du `useFocusEffect`.

---

### BUG — `permissions` vides après `fetchUserProfileThunk`

- **Fichier** : `src/store/auth.slice.ts` (ligne 108)
- **Problème** : `mappedUser.permissions = raw.permissions || []`. Or le endpoint `/users/me` du backend **ne retourne PAS de champ `permissions`** — les permissions sont uniquement dans le JWT. Après un token refresh, les permissions Redux deviennent `[]`, ce qui casse `AbilityGate` / CASL. L'ability sera vide = aucune permission.
- **Impact** : Après refresh, le composant `Can` refuserait toute capacité.

---

### BUG POTENTIEL — `searchQuery` state dans les dépendances de `useFocusEffect`

- **Fichier** : `src/screens/Partner/PartnerListScreen.tsx` (lignes 53-57)
- `loadScans()` utilise `searchQuery` via fermeture, mais `useFocusEffect` ne dépend que de `eventId`. Si on revient sur l'écran avec un `searchQuery` en mémoire, la requête enverra la recherche précédente sans que l'input le reflète visuellement (ça peut passer ou non selon le timing).

---

### BUG — `handleSearch` déclenche une requête API à chaque frappe clavier

- **Fichier** : `src/screens/Partner/PartnerListScreen.tsx` (lignes 87-90)
- `onChangeText={handleSearch}` → dispatch immédiat = une requête réseau par lettre tapée. Il manque un **debounce**.

---

### BUG — `PartnerScanScreen` ne gère pas le retour à la caméra correctement en cas d'erreur duplicate

- **Fichier** : `src/screens/Partner/PartnerScanScreen.tsx` (lignes 149-154)
- Quand le scan échoue (duplicate), `resetScan()` est appelé après 3s via `setTimeout`. Mais si l'utilisateur switch de tab pendant ces 3s, le timeout continue et potentiellement appelle `setState` sur un composant démonté.

---

## 2. PROBLÈMES D'ARCHITECTURE

### La navigation est basée sur `role === 'PARTNER'` (string hardcodée)

- **3 fichiers dupliqués** :
  - `src/screens/Events/OngoingEventsScreen.tsx` (ligne 64)
  - `src/screens/Events/UpcomingEventsScreen.tsx` (ligne 63)
  - `src/screens/Events/PastEventsScreen.tsx` (ligne 65)
- Tous font `const target = userRole === 'PARTNER' ? 'PartnerInner' : 'EventInner'`
- **Fragile** : si un nouveau rôle arrive (ex: `EXHIBITOR`, `SPONSOR`, `SPEAKER`), il faudra modifier 3 fichiers minimum. Devrait être centralisé.

---

### CASL est monté mais **jamais utilisé** dans les écrans Partner

- `useAbility()` et `<Can>` ne sont utilisés **nulle part** dans les écrans. La navigation est entièrement basée sur `role` string, pas sur les permissions CASL.
- L'infrastructure CASL (`AbilityGate`, `AbilityProvider`, `buildAbilityFor`) est en place mais ne sert à rien actuellement.

---

### Le `partnerScans` slice n'est PAS persisté

- `src/store/index.ts` (ligne 38) : seul `auth` est persisté. Si l'app est fermée puis rouverte, les scans sont perdus → full reload. C'est acceptable mais c'est un choix à connaître.

---

### Double source de vérité pour le scan courant

- `PartnerScanDetailScreen` a un state local `scan` **et** lit `currentScan` du Redux store.
- `useEffect` synchronise depuis `scans[]` ou API, mais si le scan est mis à jour dans Redux (ex: commentaire modifié), le state local peut être désynchronisé.

---

## 3. CODE SMELLS & AMÉLIORATIONS

| Problème | Fichier | Suggestion |
|----------|---------|------------|
| `as never` casts dans la navigation | `PartnerListScreen.tsx` L93 | Typer correctement avec `NativeStackNavigationProp` |
| Couleurs hardcodées (`'#FFFFFF'`, `'#2563EB'`, `'#000000'`) | `PartnerScanScreen`, `PartnerInnerTabs` | Utiliser `theme.colors.*` partout |
| Textes UI hardcodés en français | Tous les écrans | Utiliser `t('partner.list.title')` — `useTranslation` est importé mais jamais utilisé |
| `ItemSeparatorComponent={() => <View.../>}` | `PartnerListScreen` L270 | Crée un nouveau composant à chaque render, extraire en const |
| `CountBadge` défini comme composant inline | `PartnerListScreen` L204 | Devrait être extrait ou mémorisé (`useMemo`) pour éviter les re-renders |
| `formatDate` recalculé à chaque render | `PartnerListScreen` L100 | Pas de mémoisation, ok si la liste est courte, mais pourrait utiliser `useMemo` pour de grosses listes |

---

## 4. PROPOSITIONS POUR RENDRE L'APP MULTI-RÔLE & FLEXIBLE

### A) Centraliser le routage par rôle dans un seul fichier

```typescript
// src/navigation/roleRouteMap.ts
export type RoleRoute = 'EventInner' | 'PartnerInner' | 'ExhibitorInner';

const ROLE_ROUTE_MAP: Record<string, RoleRoute> = {
  ADMIN: 'EventInner',
  ORGANIZER: 'EventInner',
  PARTNER: 'PartnerInner',
  EXHIBITOR: 'ExhibitorInner', // futur
  SPEAKER: 'SpeakerInner',    // futur
  VIEWER: 'EventInner',       // fallback
};

export const getRouteForRole = (role?: string): RoleRoute => {
  return ROLE_ROUTE_MAP[role || ''] || 'EventInner';
};
```

Puis dans les 3 event screens, une seule ligne :

```typescript
const target = getRouteForRole(userRole);
```

---

### B) Passer de `role` string à un système basé sur les permissions CASL

Au lieu de `userRole === 'PARTNER'`, utiliser :

```typescript
const ability = useAbility();
const canScanPartners = ability.can('create', 'PartnerScan');
// → si true, naviguer vers PartnerInner
```

Cela découple les écrans des noms de rôles et rend l'app flexible : un ADMIN avec la permission `partner-scans.create` pourrait aussi accéder au scan.

---

### C) Navigation dynamique basée sur les permissions

```typescript
// Au lieu de if/else par rôle, construire les tabs dynamiquement
const tabs = useMemo(() => {
  const result = [];
  if (ability.can('read', 'Attendee')) result.push({ name: 'Dashboard', component: DashboardScreen });
  if (ability.can('create', 'PartnerScan')) result.push({ name: 'Scan', component: PartnerScanScreen });
  if (ability.can('read', 'PartnerScan')) result.push({ name: 'Contacts', component: PartnerListScreen });
  result.push({ name: 'Profile', component: ProfileScreen }); // toujours
  return result;
}, [ability]);
```

---

### D) Extraire les permissions du JWT lors du refresh (pas seulement au login)

Dans `fetchUserProfileThunk`, récupérer les permissions depuis le JWT stocké :

```typescript
const storedToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
const jwtPayload = decodeJwtPayload(storedToken);
mappedUser.permissions = jwtPayload.permissions || [];
```

---

### E) Persister les scans du partenaire (optionnel)

Ajouter un `persistConfig` pour `partnerScans` dans le store, pour que la liste soit disponible immédiatement au lancement même hors-ligne.

---

## 5. RÉSUMÉ DES PRIORITÉS

| Priorité | Action | Effort |
|----------|--------|--------|
| **P0** | Fix permissions vides après token refresh | 15 min |
| **P0** | Ajouter debounce sur la recherche | 10 min |
| **P1** | Centraliser le routage par rôle (`roleRouteMap`) | 20 min |
| **P1** | Cleanup des scans au changement d'événement | 5 min |
| **P1** | Cleanup `setTimeout` dans PartnerScanScreen (useRef + clearTimeout) | 10 min |
| **P2** | Remplacer textes hardcodés par `t()` | 30 min |
| **P2** | Remplacer couleurs hardcodées par `theme.colors.*` | 15 min |
| **P2** | Navigation dynamique basée sur permissions CASL | 1-2h |
| **P3** | Persister le slice partnerScans | 10 min |

---

## 6. FICHIERS CONCERNÉS (INVENTAIRE)

### Créés pour la feature :
- `src/screens/Partner/PartnerScanScreen.tsx`
- `src/screens/Partner/PartnerListScreen.tsx`
- `src/screens/Partner/PartnerScanDetailScreen.tsx`
- `src/navigation/PartnerInnerTabs.tsx`
- `src/types/partnerScan.ts`
- `src/api/backend/partnerScans.service.ts`
- `src/store/partnerScans.slice.ts`

### Modifiés pour la feature :
- `src/navigation/AppNavigator.tsx` — Route `PartnerInner`
- `src/screens/Events/OngoingEventsScreen.tsx` — Navigation conditionnelle
- `src/screens/Events/UpcomingEventsScreen.tsx` — Navigation conditionnelle
- `src/screens/Events/PastEventsScreen.tsx` — Navigation conditionnelle
- `src/store/auth.slice.ts` — Mapping du profil utilisateur
- `src/store/index.ts` — Ajout du reducer `partnerScans`
- `src/permissions/ability.ts` — Subject map `partner-scans` → `PartnerScan`
- `src/types/auth.ts` — Interfaces `BackendUser`, `BackendLoginResponse`
- `src/api/backend/auth.service.ts` — `mapLoginResponse`, `decodeJwtPayload`
- `App.tsx` — `AbilityGate` component
