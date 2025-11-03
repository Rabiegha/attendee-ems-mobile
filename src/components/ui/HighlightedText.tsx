import React from 'react';
import { Text, TextStyle } from 'react-native';
import { normalizeSearchText } from '../../hooks/useSearch';

interface HighlightedTextProps {
  /** Texte à afficher */
  text: string;
  /** Requête de recherche pour surlignage */
  searchQuery: string;
  /** Style du texte normal */
  style?: TextStyle;
  /** Style du texte surligné */
  highlightStyle?: TextStyle;
  /** Couleur de surlignage (si highlightStyle n'est pas fourni) */
  highlightColor?: string;
  /** Nombre de lignes maximum */
  numberOfLines?: number;
}

/**
 * Composant pour afficher du texte avec surlignage des termes de recherche
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  searchQuery,
  style,
  highlightStyle,
  highlightColor = '#FFD700', // Jaune par défaut
  numberOfLines,
}) => {
  // Si pas de recherche, afficher le texte normal
  if (!searchQuery.trim()) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const normalizedQuery = normalizeSearchText(searchQuery);
  const normalizedText = normalizeSearchText(text);
  
  // Diviser la requête en mots
  const queryWords = normalizedQuery.split(' ').filter((word: string) => word.length > 0);
  
  if (queryWords.length === 0) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  // Trouver toutes les positions des mots à surligner
  const matches: Array<{ start: number; end: number; word: string }> = [];
  
  queryWords.forEach((word: string) => {
    let startIndex = 0;
    while (true) {
      const index = normalizedText.indexOf(word, startIndex);
      if (index === -1) break;
      
      matches.push({
        start: index,
        end: index + word.length,
        word,
      });
      
      startIndex = index + 1;
    }
  });

  // Trier les matches par position
  matches.sort((a, b) => a.start - b.start);

  // Fusionner les matches qui se chevauchent
  const mergedMatches: Array<{ start: number; end: number }> = [];
  matches.forEach(match => {
    const lastMatch = mergedMatches[mergedMatches.length - 1];
    if (lastMatch && match.start <= lastMatch.end) {
      // Fusionner avec le match précédent
      lastMatch.end = Math.max(lastMatch.end, match.end);
    } else {
      mergedMatches.push({ start: match.start, end: match.end });
    }
  });

  // Construire les segments de texte
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  mergedMatches.forEach((match, index) => {
    // Ajouter le texte avant le match
    if (match.start > lastIndex) {
      segments.push(
        <Text key={`normal-${index}`} style={style}>
          {text.substring(lastIndex, match.start)}
        </Text>
      );
    }

    // Ajouter le texte surligné
    segments.push(
      <Text
        key={`highlight-${index}`}
        style={[
          style,
          highlightStyle || { backgroundColor: highlightColor, fontWeight: 'bold' },
        ]}
      >
        {text.substring(match.start, match.end)}
      </Text>
    );

    lastIndex = match.end;
  });

  // Ajouter le texte restant après le dernier match
  if (lastIndex < text.length) {
    segments.push(
      <Text key="normal-end" style={style}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return (
    <Text numberOfLines={numberOfLines}>
      {segments}
    </Text>
  );
};