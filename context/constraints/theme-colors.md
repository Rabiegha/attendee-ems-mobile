# Contrainte : Utilisation obligatoire des tokens du thème

## Règle

**Ne JAMAIS utiliser de couleurs hardcodées** (`#FFFFFF`, `#000000`, `#3B82F6`, etc.) dans les composants React Native.  
Toutes les couleurs doivent provenir de l'objet `theme` fourni par `useTheme()`.

## Pourquoi

- Cohérence visuelle sur toute l'app
- Support du dark mode (les couleurs s'adaptent automatiquement)
- Une seule source de vérité : `src/theme/tokens.ts`
- Facilite les changements de charte graphique

## Comment faire

### 1. Récupérer le thème dans le composant

```tsx
import { useTheme } from '../../theme/ThemeProvider';
import type { Theme } from '../../theme';

const MyComponent = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // ...
};
```

### 2. Créer les styles en fonction du thème

```tsx
// ❌ INTERDIT
const styles = StyleSheet.create({
  button: { backgroundColor: '#3B82F6' },
  text: { color: '#FFFFFF' },
});

// ✅ CORRECT
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: { backgroundColor: theme.colors.brand[500] },
    text: { color: theme.colors.text.inverse },
  });
```

### 3. Idem pour les couleurs inline (props d'icônes, etc.)

```tsx
// ❌ INTERDIT
<Ionicons name="close" size={28} color="#FFFFFF" />

// ✅ CORRECT
<Ionicons name="close" size={28} color={theme.colors.text.inverse} />
```

## Mapping rapide des couleurs les plus courantes

| Usage | Token |
|---|---|
| Texte blanc sur fond coloré | `theme.colors.text.inverse` |
| Fond noir | `theme.colors.neutral[950]` |
| Bouton principal | `theme.colors.brand[600]` |
| Texte principal | `theme.colors.text.primary` |
| Texte secondaire | `theme.colors.text.secondary` |
| Bordures | `theme.colors.border` |
| Fond de surface/carte | `theme.colors.surface` |
| Succès (vert) | `theme.colors.success[500]` |
| Erreur (rouge) | `theme.colors.error[500]` |
| Warning (orange) | `theme.colors.warning[500]` |
| Info (bleu) | `theme.colors.info[500]` |
| Bouton désactivé | `theme.colors.neutral[600]` |
| Ombres | `theme.shadows.sm` / `md` / `lg` |
| Spacing | `theme.spacing.xs` / `sm` / `md` / `lg` / `xl` |
| Font sizes | `theme.fontSize.sm` / `base` / `lg` / `xl` |
| Border radius | `theme.radius.sm` / `md` / `lg` / `xl` |

## Exceptions acceptées

- `rgba(0, 0, 0, 0.5)` pour les overlays transparents (pas de token équivalent)
- Couleurs dynamiques venant de l'API (ex : `attendeeType.color_hex`)
- Composants de debug uniquement (`src/components/debug/`)

## Référence

- Tokens : `src/theme/tokens.ts`
- Thème (light/dark) : `src/theme/index.ts`
- Provider : `src/theme/ThemeProvider.tsx`
- Audit complet : `docs/THEME_COLORS_AUDIT.md`
