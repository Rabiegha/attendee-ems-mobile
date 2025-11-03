# Système de Recherche Centralisé

Un système de recherche avancé avec surlignage de texte, recherche en temps réel et normalisation des accents pour l'application mobile EMS.

## Fonctionnalités

✨ **Recherche en temps réel** - Refetch automatique des données avec debounce  
🎯 **Surlignage intelligent** - Met en évidence les termes recherchés dans le texte  
🌍 **Insensible aux accents** - Recherche qui ignore accents, espaces et casse  
🔄 **Inversion nom/prénom** - Gère automatiquement l'inversion des noms  
⚡ **Performance optimisée** - Debounce configurable et normalisation efficace  
🎨 **Personnalisable** - Styles de surlignage configurables  

## Structure

```
src/
├── hooks/
│   ├── useSearch.ts          # Hook principal de recherche
│   └── index.ts              # Export centralisé
├── components/ui/
│   ├── HighlightedText.tsx   # Composant de surlignage
│   ├── AdvancedSearchBar.tsx # Barre de recherche avancée
│   └── index.ts              # Export centralisé
└── screens/
    └── EventDashboard/
        └── AttendeesListScreen.tsx # Exemple d'implémentation
```

## Utilisation Basique

### 1. Hook useSearch

```typescript
import { useSearch } from '../../hooks/useSearch';

const MyComponent = () => {
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearchActive,
    isSearching,
  } = useSearch({
    debounceDelay: 300,
    minSearchLength: 1,
    onSearch: (query) => {
      // Refetch des données
      fetchData(query);
    }
  });

  return (
    <SearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Rechercher..."
    />
  );
};
```

### 2. Composant HighlightedText

```typescript
import { HighlightedText } from '../../components/ui/HighlightedText';

const ListItem = ({ item, searchQuery }) => (
  <View>
    <HighlightedText
      text={\`\${item.firstName} \${item.lastName}\`}
      searchQuery={searchQuery}
      style={{ fontSize: 16, color: '#000' }}
      highlightStyle={{
        backgroundColor: '#FFD700',
        fontWeight: 'bold',
        color: '#333',
      }}
    />
  </View>
);
```

### 3. Hook useListSearch (pour filtrage local)

```typescript
import { useListSearch } from '../../components/ui/AdvancedSearchBar';

const MyListComponent = ({ items }) => {
  const {
    searchQuery,
    setSearchQuery,
    filteredItems,
    isSearching,
  } = useListSearch(
    items,
    (item) => [
      \`\${item.firstName} \${item.lastName}\`,
      item.company || '',
      item.email || ''
    ],
    {
      debounceDelay: 200,
      onSearchChange: (filtered, query) => {
        console.log(\`Found \${filtered.length} results for "\${query}"\`);
      }
    }
  );

  return (
    <>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <HighlightedText 
            text={\`\${item.firstName} \${item.lastName}\`}
            searchQuery={searchQuery}
          />
        )}
      />
    </>
  );
};
```

## Fonctionnalités Avancées

### Normalisation de Texte

La fonction `normalizeSearchText` gère automatiquement :
- Suppression des accents (é → e, ç → c, etc.)
- Conversion en minuscules
- Suppression des espaces multiples
- Trim automatique

```typescript
import { normalizeSearchText } from '../../hooks/useSearch';

// "José María" → "jose maria"
const normalized = normalizeSearchText("José María");
```

### Matching Intelligent

La fonction `matchesSearchQuery` gère :
- Recherche partielle dans tous les champs
- Inversion nom/prénom automatique
- Recherche multi-mots (tous les mots doivent être présents)

```typescript
import { matchesSearchQuery } from '../../hooks/useSearch';

const matches = matchesSearchQuery(
  "Jean Dupont",           // Texte principal
  "dupont jean",           // Requête (inversée)
  ["jean.dupont@email.fr"] // Champs additionnels
); // → true
```

### Surlignage Personnalisé

Le composant `HighlightedText` supporte :
- Couleurs personnalisées
- Styles de police
- Nombre de lignes limité
- Fusion automatique des matches qui se chevauchent

```typescript
<HighlightedText
  text="Jean-Marie Dupont-Martin"
  searchQuery="marie dupont"
  style={{ fontSize: 18, color: '#333' }}
  highlightColor="#FFD700"
  highlightStyle={{
    backgroundColor: '#FFD700',
    fontWeight: 'bold',
    color: '#000',
    borderRadius: 4,
    paddingHorizontal: 2,
  }}
  numberOfLines={2}
/>
```

## Configuration

### Options du Hook useSearch

```typescript
interface UseSearchOptions {
  debounceDelay?: number;      // 300ms par défaut
  minSearchLength?: number;    // 1 par défaut
  onSearch?: (query: string) => void;
  initialValue?: string;       // '' par défaut
}
```

### Props du Composant HighlightedText

```typescript
interface HighlightedTextProps {
  text: string;                // Texte à afficher
  searchQuery: string;         // Requête de recherche
  style?: TextStyle;           // Style du texte normal
  highlightStyle?: TextStyle;  // Style du texte surligné
  highlightColor?: string;     // Couleur de surlignage (#FFD700)
  numberOfLines?: number;      // Limite de lignes
}
```

## Exemples d'Implémentation

### AttendeesListScreen (Recherche avec Refetch)

L'écran des participants utilise le système pour :
- Recherche en temps réel avec refetch des données backend
- Surlignage des noms et entreprises
- Indicateur visuel de recherche en cours
- Gestion de l'inversion nom/prénom

### EventsListScreen (Recherche Locale)

Exemple d'utilisation pour filtrage local :

```typescript
const EventsList = ({ events }) => {
  const {
    searchQuery,
    setSearchQuery,
    filteredItems: filteredEvents
  } = useListSearch(
    events,
    (event) => [
      event.title,
      event.description,
      event.location
    ]
  );

  return (
    <>
      <AdvancedSearchBar onSearchChange={setSearchQuery} />
      {filteredEvents.map(event => (
        <View key={event.id}>
          <HighlightedText
            text={event.title}
            searchQuery={searchQuery}
          />
        </View>
      ))}
    </>
  );
};
```

## Performance

### Optimisations Incluses

- **Debouncing** : Évite les appels API excessifs
- **Memoization** : Les résultats filtrés sont mis en cache
- **Normalisation efficace** : Utilise l'API native JavaScript
- **Lazy evaluation** : Le surlignage n'est calculé qu'au rendu

### Bonnes Pratiques

1. **Utilisez un debounce approprié** : 300ms pour API, 150ms pour filtrage local
2. **Limitez les champs de recherche** : Ne cherchez que dans les champs pertinents
3. **Gérez l'état de chargement** : Affichez des indicateurs pendant la recherche
4. **Optimisez le rendu** : Utilisez `numberOfLines` pour limiter le texte affiché

## Accessibilité

- Support des lecteurs d'écran
- Navigation clavier complète
- Contrastes de couleurs respectés
- Indicateurs visuels clairs

## Tests

```typescript
// Test de normalisation
expect(normalizeSearchText("José María")).toBe("jose maria");

// Test de matching
expect(matchesSearchQuery("Jean Dupont", "dupont jean")).toBe(true);

// Test d'inversion nom/prénom  
expect(matchesSearchQuery("Marie Martin", "martin marie")).toBe(true);
```

## Migration

Pour migrer d'un système de recherche existant :

1. Remplacez `useState` par `useSearch`
2. Remplacez `Text` par `HighlightedText` 
3. Ajoutez la logique de refetch dans `onSearch`
4. Configurez le debounce selon vos besoins

## Support

Ce système est conçu pour être :
- **Réutilisable** : Utilisable dans n'importe quel écran
- **Extensible** : Facilement personnalisable
- **Performant** : Optimisé pour les grandes listes
- **Accessible** : Respecte les standards d'accessibilité