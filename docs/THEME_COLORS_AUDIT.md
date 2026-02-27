# Audit des couleurs hardcodées - attendee-ems-mobile

> **Date** : 26 février 2026  
> **Branche de référence** : `main`  
> **Total** : ~121 couleurs hardcodées à migrer vers les tokens du thème

## Mapping des couleurs → tokens

| Couleur hardcodée | Token du thème |
|---|---|
| `#FFFFFF`, `#fff` | `theme.colors.text.inverse` |
| `#000000`, `#000` | `theme.colors.neutral[950]` |
| `#2563EB` | `theme.colors.brand[600]` |
| `#3B82F6` | `theme.colors.brand[500]` |
| `#007AFF` | `theme.colors.brand[600]` |
| `#6366F1` | ⚠️ Pas dans le thème (Indigo) → ajouter ou utiliser `brand[500]` |
| `#818CF8` | ⚠️ Pas dans le thème (Indigo light) → ajouter ou utiliser `brand[400]` |
| `#10B981` | `theme.colors.success[500]` (⚠️ ancienne valeur Emerald, remplacée par `#22c55e`) |
| `#34D399` | ⚠️ Pas dans le thème → utiliser `success[500]` ou ajouter `success[400]` |
| `#22c55e` | `theme.colors.success[500]` |
| `#4CAF50` | `theme.colors.success[500]` (approximation) |
| `#EF4444` | `theme.colors.error[500]` |
| `#F87171` | `theme.colors.error[400]` |
| `#DC2626` | `theme.colors.error[600]` |
| `#FF3B30` | `theme.colors.error[500]` (approximation iOS) |
| `#F59E0B` | `theme.colors.warning[500]` |
| `#D97706` | `theme.colors.warning[600]` |
| `#4B5563` | `theme.colors.neutral[600]` |
| `#6B7280` | `theme.colors.neutral[500]` |
| `#9CA3AF` | `theme.colors.neutral[400]` |
| `#94a3b8` | `theme.colors.neutral[400]` (approximation Slate) |
| `#374151` | `theme.colors.neutral[700]` |
| `#1F2937` | `theme.colors.neutral[800]` |
| `#E5E7EB` | `theme.colors.neutral[200]` |
| `#f0f0f0` | `theme.colors.neutral[100]` |
| `#FFD700` | ⚠️ Pas dans le thème (Gold) → ajouter ou garder comme prop |
| `shadowColor: '#000'` | `theme.shadows.sm/md/lg` (utiliser l'objet shadow complet) |
| `rgba(0, 0, 0, 0.5)` | Acceptable (overlay transparent) |
| `rgba(0, 0, 0, 0.6)` | Acceptable (overlay transparent) |

## Fichiers à corriger (par priorité)

| Fichier | Nb | Couleurs en dur | Priorité |
|---|---|---|---|
| `src/screens/Scan/ScanScreen.tsx` | ~20 | `#000000`, `#FFFFFF`, `#EF4444`, `#3B82F6`, `#10B981`, `#F59E0B`, `#4B5563`, `#9CA3AF` | 🔴 Haute |
| `src/screens/EventDashboard/AttendeesListScreen.tsx` | ~18 | `#FFFFFF`, `#1F2937`, `#374151`, `#6366F1`, `#818CF8`, `#EF4444`, `#10B981`, `#F87171`, `#34D399` | 🔴 Haute |
| `src/screens/EventDashboard/AttendeeDetailsScreen.tsx` | ~10 | `#FFFFFF`, `#000` | 🟡 Moyenne |
| `src/screens/Attendees/AttendeeAddScreen.tsx` | 6 | `#EF4444`, `#007AFF` | 🟡 Moyenne |
| `src/components/modals/FilterModal.tsx` | 5 | `#10B981`, `#F59E0B`, `#EF4444`, `#6B7280`, `#000` | 🟡 Moyenne |
| `src/navigation/EventInnerTabs.tsx` | 4 | `#FFFFFF`, `#000`, `#2563EB` | 🟡 Moyenne |
| `src/navigation/PartnerInnerTabs.tsx` | 3 | `#FFFFFF`, `#000` | 🟡 Moyenne |
| `src/screens/Partner/PartnerListScreen.tsx` | 3 | `#fff` | 🟡 Moyenne |
| `src/screens/Partner/PartnerScanDetailScreen.tsx` | 2 | `#FFFFFF` | 🟢 Basse |
| `src/screens/Events/PastEventsScreen.tsx` | 1 | `#FFFFFF` | 🟢 Basse |
| `src/screens/Events/OngoingEventsScreen.tsx` | 2 | `#FFFFFF` | 🟢 Basse |
| `src/screens/Events/UpcomingEventsScreen.tsx` | 2 | `#FFFFFF` | 🟢 Basse |
| `src/screens/Print/PrintersListScreen.tsx` | 3 | `#FFFFFF`, `#E5E7EB` | 🟢 Basse |
| `src/screens/Print/EmsPrintersListScreen.tsx` | 3 | `#FFFFFF`, `#D97706`, `#DC2626` | 🟢 Basse |
| `src/screens/Print/PrintSettingsScreen.tsx` | 1 | `#FFFFFF` | 🟢 Basse |
| `src/screens/EventDashboard/StatsScreen.tsx` | 6 | `#94a3b8` (fallback dynamique) | 🟢 Basse |
| `src/screens/OnboardingScreen.tsx` | 1 | `#FFFFFF` | 🟢 Basse |
| `src/components/ui/Toast.tsx` | 2 | `#FFFFFF`, `#000` | 🟢 Basse |
| `src/components/ui/EmptyState.tsx` | 1 | `#FFFFFF` | 🟢 Basse |
| `src/components/ui/ErrorState.tsx` | 1 | `#FFFFFF` | 🟢 Basse |
| `src/components/ui/Card.tsx` | 1 | `#000` (shadow) | 🟢 Basse |
| `src/components/ui/ConfirmDialog.tsx` | 1 | `#000` (shadow) | 🟢 Basse |
| `src/components/ui/PrintStatusBanner.tsx` | 1 | `#000` (shadow) | 🟢 Basse |
| `src/components/ui/HighlightedText.tsx` | 1 | `#FFD700` (prop par défaut) | 🟢 Basse |
| `src/components/info/BadgeConfigInfo.tsx` | 4 | `#e7f5e7`, `#4CAF50`, `#2e7b2e`, `#5a8e5a` | 🟢 Basse |
| `src/components/debug/PrinterDebugComponent.tsx` | 4 | `#f0f0f0`, `#007AFF`, `#34C759`, `#FF3B30` | ⚪ Debug only |

## Pattern de migration

### Avant (hardcodé)
```tsx
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3B82F6',
  },
  text: {
    color: '#FFFFFF',
  },
});
```

### Après (thème)
```tsx
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.colors.brand[500],
    },
    text: {
      color: theme.colors.text.inverse,
    },
  });

// Dans le composant :
const styles = useMemo(() => createStyles(theme), [theme]);
```

## Tokens manquants à ajouter dans `src/theme/tokens.ts`

Si on veut garder les couleurs Indigo utilisées dans `AttendeesListScreen` :

```ts
// Dans tokens.ts → colors
indigo: {
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
},

// Ajouter aussi success[400] si besoin
success: {
  // ...existants
  400: '#4ade80',
},
```

## Fichier déjà corrigé ✅

- `src/screens/Partner/PartnerScanScreen.tsx` — Migré dans la branche `Partner-scan`
