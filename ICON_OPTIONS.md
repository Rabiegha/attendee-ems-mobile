# Options d'icônes pour le bouton retour

## Option actuelle (APPLIQUÉE) ✅
```tsx
<Ionicons name="chevron-back" size={24} color={theme.colors.brand[600]} />
```

## Autres options Ionicons

### 1. Flèche simple
```tsx
<Ionicons name="arrow-back" size={24} color={theme.colors.brand[600]} />
```

### 2. Flèche arrondie
```tsx
<Ionicons name="arrow-back-circle" size={28} color={theme.colors.brand[600]} />
```

### 3. Flèche arrondie outline
```tsx
<Ionicons name="arrow-back-circle-outline" size={28} color={theme.colors.brand[600]} />
```

### 4. Chevron arrondi
```tsx
<Ionicons name="chevron-back-circle" size={28} color={theme.colors.brand[600]} />
```

### 5. Chevron arrondi outline
```tsx
<Ionicons name="chevron-back-circle-outline" size={28} color={theme.colors.brand[600]} />
```

### 6. Flèche iOS style
```tsx
<Ionicons name="ios-arrow-back" size={24} color={theme.colors.brand[600]} />
```

## Options MaterialIcons

### 7. Flèche Material Design
```tsx
import { MaterialIcons } from '@expo/vector-icons';
<MaterialIcons name="arrow-back" size={24} color={theme.colors.brand[600]} />
```

### 8. Flèche iOS Material
```tsx
<MaterialIcons name="arrow-back-ios" size={20} color={theme.colors.brand[600]} />
```

## Options Feather (Style minimaliste)

### 9. Chevron Feather
```tsx
import { Feather } from '@expo/vector-icons';
<Feather name="chevron-left" size={24} color={theme.colors.brand[600]} />
```

### 10. Flèche Feather
```tsx
<Feather name="arrow-left" size={24} color={theme.colors.brand[600]} />
```

## Options AntDesign

### 11. Flèche AntDesign
```tsx
import { AntDesign } from '@expo/vector-icons';
<AntDesign name="arrowleft" size={24} color={theme.colors.brand[600]} />
```

### 12. Flèche arrondie AntDesign
```tsx
<AntDesign name="leftcircle" size={28} color={theme.colors.brand[600]} />
```

### 13. Flèche arrondie outline
```tsx
<AntDesign name="leftcircleo" size={28} color={theme.colors.brand[600]} />
```

---

## Comment changer ?

Dans `/src/screens/EventDashboard/EventDashboardScreen.tsx`, ligne ~82, remplacez simplement :
```tsx
<Ionicons name="chevron-back" size={24} color={theme.colors.brand[600]} />
```

Par l'une des options ci-dessus.

## Mes recommandations personnelles :

1. **Pour iOS style** : `arrow-back-ios` (MaterialIcons)
2. **Pour un look moderne** : `chevron-back-circle-outline` (Ionicons)
3. **Pour minimaliste** : `chevron-left` (Feather)
4. **Pour Material Design** : `arrow-back` (MaterialIcons)
