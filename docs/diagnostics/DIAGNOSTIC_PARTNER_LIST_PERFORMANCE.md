# Diagnostic — Performance & État de la Liste des Contacts Partenaire

**Date** : 6 mars 2026
**Branche** : `main`
**Fichiers analysés** :
- `src/screens/Partner/PartnerListScreen.tsx`
- `src/screens/Partner/PartnerScanDetailScreen.tsx`
- `src/store/partnerScans.slice.ts`
- `src/api/backend/partnerScans.service.ts`
- `src/types/partnerScan.ts`

---

## 1. État actuel du chargement

### ❌ Pas de lazy loading / infinite scroll

La `FlatList` n'a **ni `onEndReached`, ni `onEndReachedThreshold`**. Il n'y a aucun mécanisme pour charger automatiquement la page suivante quand l'utilisateur arrive en bas de la liste.

```tsx
// PartnerListScreen.tsx — ce qui est présent
<FlatList
  data={scans}
  renderItem={renderScanItem}
  keyExtractor={(item) => item.id}
  // ❌ PAS de onEndReached
  // ❌ PAS de onEndReachedThreshold
/>
```

### ❌ Limite fixe de 50, jamais incrémentée

```tsx
// loadScans() — limit hardcodée
fetchPartnerScansThunk({ event_id: eventId, page, limit: 50, ... })
```

Le reducer **remplace** le tableau entier à chaque appel (pas d'append) :
```ts
// partnerScans.slice.ts
.addCase(fetchPartnerScansThunk.fulfilled, (state, action) => {
  state.scans = action.payload.data; // ← replace, pas concat
  state.meta = action.payload.meta;
});
```

→ Même si on appelait `loadScans(page=2)`, les résultats de page 1 seraient écrasés.

---

## 2. Scenarios par volume

### ✅ 10–50 contacts — OK

Tout fonctionne normalement. La liste charge en une seule requête, s'affiche sans problème.

### ⚠️ 100 contacts — Tronqué silencieusement

- L'API retourne les 50 premiers contacts uniquement
- `meta.total` = 100 ✓ (le badge d'en-tête affiche "100")
- `state.scans.length` = 50 ✗ (la liste n'en montre que 50)
- **L'utilisateur voit "100" dans le badge mais ne peut accéder qu'aux 50 premiers contacts**
- Aucun message d'avertissement, aucun bouton "charger plus"

### 🔴 300 contacts — Problème fonctionnel

Même comportement : 50 contacts affichés, 300 annoncés dans le badge.
Le partenaire ne peut pas retrouver un contact qui n'est pas dans les 50 premiers, **sauf via la recherche** (qui, elle, est serveur-side → correcte).

La recherche sauve partiellement la situation mais :
- Elle ne fonctionne que si on connaît le nom/email à chercher
- Il est impossible de faire défiler la liste complète

### 🔴🔴 Cas extrêmes (500+, salon professionnel avec many scans)

Si on montait la limite côté client pour contourner (ex: `limit: 500`) :
- Requête API lente
- Réponse JSON potentiellement lourde (~500 objets `PartnerScan` avec `attendee_data` imbriqué)
- Tout mis en mémoire dans Redux d'un coup
- FlatList pas optimisée pour autant d'items (voir section 3)
- **Risque de crash mémoire sur appareils bas de gamme**

---

## 3. Problèmes de performance identifiés

### 🔴 `renderScanItem` non mémoïsé

```tsx
// Inline dans le composant → recréée à chaque render
const renderScanItem = ({ item }: { item: PartnerScan }) => { ... };
```

FlatList ne peut pas optimiser le re-render des cellules. Chaque setState (ex: `searchQuery`) force le re-render de toutes les cellules visibles.

**Fix** : `useCallback` + composant `ScanItem` séparé avec `React.memo`.

---

### 🟡 `formatDate` recalculée à chaque scroll

```tsx
// Appelée dans renderScanItem pour chaque item visible
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr); // ← new Date() à chaque render
  ...
};
```

Avec 50 items et un scroll rapide, cela représente ~500 appels `new Date()` en quelques secondes.

**Fix** : pré-calculer et stocker dans `useMemo` sur les données, ou utiliser une librairie légère type `date-fns`.

---

### 🟡 `CountBadge` défini dans le corps du composant

```tsx
// Recréé à chaque render du parent
const CountBadge = () => ( ... );
```

React traite ce composant comme un composant différent à chaque render → démontage/remontage inutile.

**Fix** : déplacer à l'extérieur du composant ou mémoïser avec `useMemo`.

---

### 🟡 FlatList sans optimisations de fenêtrage

```tsx
<FlatList
  data={scans}
  renderItem={renderScanItem}
  // ❌ Pas de getItemLayout
  // ❌ Pas de initialNumToRender
  // ❌ Pas de maxToRenderPerBatch
  // ❌ Pas de windowSize
/>
```

Sans `getItemLayout`, FlatList ne peut pas calculer les positions des items à l'avance → pas de virtualisation efficace, scroll moins fluide sur les grandes listes.

---

### 🟡 `clearPartnerScans()` au focus → pas de cache

```tsx
useFocusEffect(useCallback(() => {
  dispatch(clearPartnerScans()); // ← vide le store à chaque retour sur l'écran
  loadScans();
}, [eventId]));
```

À chaque fois que l'utilisateur revient sur la liste (ex: depuis le détail), les données sont effacées et rechargées depuis l'API. Pas de stale-while-revalidate, pas de cache.

**En pratique** : l'écran flashe blanc (~300ms de loading) à chaque navigation retour.

---

## 4. Ce qui fonctionne bien ✅

| Fonctionnalité | État |
|---|---|
| Recherche serveur-side | ✅ Correcte |
| Debounce 400ms sur la recherche | ✅ Bien implémenté |
| Annulation des requêtes en vol (abort) | ✅ Race condition gérée |
| Pull-to-refresh | ✅ Fonctionnel |
| Empty state / Error state | ✅ Bien géré |
| `ItemSeparator` stable (`useCallback`) | ✅ Bonne pratique |
| Détail : fallback API si item absent du store | ✅ Robuste |
| Export CSV dans le service | ✅ Implémenté (mais pas exposé dans l'UI) |

---

## 5. Propositions d'amélioration

### P1 — 🔴 Infinite scroll (priorité haute)

Implémenter le chargement par page au scroll :

```tsx
// Dans le slice : passer de replace à append pour page > 1
.addCase(fetchPartnerScansThunk.fulfilled, (state, action) => {
  if (action.meta.arg.page === 1) {
    state.scans = action.payload.data;      // reset sur page 1
  } else {
    state.scans.push(...action.payload.data); // append sur les suivantes
  }
  state.meta = action.payload.meta;
});

// Dans PartnerListScreen
const handleEndReached = () => {
  if (!isLoading && meta.page < meta.totalPages) {
    loadScans(meta.page + 1, searchQuery);
  }
};

<FlatList
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.3}
/>
```

---

### P2 — 🟡 Mémoïsation de `renderScanItem`

```tsx
// Composant dédié, stable
const ScanItem = React.memo(({ item, onPress, theme }: {...}) => { ... });

// Dans PartnerListScreen
const renderScanItem = useCallback(
  ({ item }: { item: PartnerScan }) => (
    <ScanItem item={item} onPress={handlePressScan} theme={theme} />
  ),
  [theme] // seulement si le thème change
);
```

---

### P3 — 🟡 `getItemLayout` pour la FlatList

Si les items ont une hauteur fixe ou estimable :

```tsx
<FlatList
  getItemLayout={(_, index) => ({
    length: 72,   // hauteur estimée d'un item + séparateur
    offset: 80 * index,
    index,
  })}
  initialNumToRender={12}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

### P4 — 🟡 Stale-while-revalidate (éviter le flash blanc)

Au lieu de `clearPartnerScans()` au focus, garder les données en cache et les refresher en arrière-plan :

```tsx
useFocusEffect(useCallback(() => {
  // Ne pas vider si on a déjà des données, juste rafraîchir
  if (scans.length === 0) {
    dispatch(clearPartnerScans());
  }
  loadScans(); // les nouvelles données remplaceront les anciennes en silence
}, [eventId]));
```

---

### P5 — 🟢 Bouton "Exporter CSV" dans l'UI

Le service `exportCsv(eventId)` est implémenté mais jamais appelé depuis l'interface. Ajouter un bouton dans le header de la liste pour permettre au partenaire d'exporter ses contacts en CSV (utile post-événement).

---

### P6 — 🟢 Indicateur "X contacts non affichés"

En attendant l'infinite scroll, ajouter un bandeau d'information si `scans.length < meta.total` :

```tsx
{scans.length < meta.total && (
  <Text style={styles.truncatedWarning}>
    Affichage des {scans.length} derniers contacts sur {meta.total}.
    Utilisez la recherche pour retrouver un contact.
  </Text>
)}
```

---

## Résumé de priorité

| # | Problème | Impact | Complexité |
|---|---|---|---|
| P1 | Pas d'infinite scroll → contacts tronqués | 🔴 Fonctionnel | Moyenne |
| P2 | `renderScanItem` non mémoïsé | 🟡 Performance | Faible |
| P3 | FlatList sans `getItemLayout` | 🟡 Performance | Faible |
| P4 | Pas de cache → flash blanc au retour | 🟡 UX | Faible |
| P5 | Export CSV non exposé dans l'UI | 🟢 Feature | Faible |
| P6 | Bandeau "contacts tronqués" | 🟢 UX | Très faible |
