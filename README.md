# Attendee EMS Mobile

Application mobile de gestion d'événements et de participants, construite avec Expo, React Native et TypeScript.

## 🚀 Stack Technique

- **Framework**: Expo + React Native
- **Langage**: TypeScript
- **UI**: NativeWind (Tailwind CSS pour React Native)
- **État**: Redux Toolkit
- **Navigation**: React Navigation (Stack + Bottom Tabs + Top Tabs)
- **HTTP**: Axios avec intercepteurs
- **Permissions**: CASL (RBAC/ABAC)
- **Stockage**: expo-secure-store + AsyncStorage
- **i18n**: react-i18next (français par défaut)
- **Dates**: dayjs (locale fr)
- **Animations**: React Native Reanimated

## 📁 Structure du Projet

```
src/
├── api/                    # Services API et client Axios
│   ├── axiosClient.ts     # Instance Axios avec intercepteurs
│   ├── auth.service.ts    # Service d'authentification
│   ├── events.service.ts  # Service événements
│   └── attendees.service.ts
├── store/                  # Redux store et slices
│   ├── index.ts
│   ├── auth.slice.ts
│   ├── events.slice.ts
│   └── attendees.slice.ts
├── navigation/             # Configuration de navigation
│   ├── AppNavigator.tsx   # Navigateur principal
│   ├── AuthNavigator.tsx
│   ├── EventsNavigator.tsx
│   └── EventInnerTabs.tsx # Bottom tab flottante
├── screens/                # Écrans de l'application
│   ├── Auth/
│   ├── Events/
│   ├── EventDashboard/
│   ├── Attendees/
│   ├── Scan/
│   ├── Print/
│   └── Settings/
├── components/             # Composants réutilisables
│   ├── ui/                # Composants UI de base
│   ├── layout/
│   └── list/
├── theme/                  # Système de thème
│   ├── tokens.ts          # Tokens de design
│   ├── index.ts           # Configuration thème
│   └── ThemeProvider.tsx
├── i18n/                   # Internationalisation
│   ├── index.ts
│   └── fr/common.json
├── utils/                  # Utilitaires
│   ├── storage.ts
│   ├── format.ts
│   └── auth.ts
├── permissions/            # CASL permissions
│   ├── ability.ts
│   └── AbilityProvider.tsx
└── types/                  # Types TypeScript
    ├── api.ts
    ├── event.ts
    ├── attendee.ts
    └── auth.ts
```

## 🔧 Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/Rabiegha/attendee-ems-mobile.git
   cd attendee-ems-mobile
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   Modifier `.env` avec vos valeurs :
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   TOKEN_EXP_SOFT_REFRESH_SECONDS=60
   ```

## 🏃 Lancer l'Application

```bash
# Démarrer le serveur de développement
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios

# Lancer sur Web
npm run web
```

## 🎨 Système de Thème

L'application utilise un système de thème hybride :
- **Tokens** : Source unique de vérité pour les couleurs, espacements, rayons
- **Tailwind** : Classes utilitaires via NativeWind
- **Runtime** : ThemeProvider pour les styles dynamiques

### Modes de thème
- Système (par défaut)
- Clair
- Sombre

## 🔐 Authentification

### Flux d'authentification
1. Login → Backend renvoie `access_token`, `refresh_token`, `expires_in`
2. `refresh_token` → Stockage sécurisé (expo-secure-store)
3. `access_token` → Mémoire Redux uniquement
4. Refresh automatique avant expiration (soft refresh)
5. Intercepteur Axios pour gérer les 401

### Exemple de login
```typescript
const credentials = {
  email: "john.doe@system.com",
  password: "admin123"
};
dispatch(loginThunk(credentials));
```

## 🧭 Navigation

### Structure
- **Auth Flow** : LoginScreen
- **Events Flow** : EventsListScreen (pas de bottom bar)
- **Event Inner Flow** : Bottom tab flottante (visible uniquement dans un événement)

### Bottom Tab Flottante
- **Participants** : Dashboard + stats
- **Ajouts** : Ajouter des participants
- **Scan** : Bouton central proéminent (QR Code)
- **Imprimer** : Paramètres d'impression
- **Menu** : Paramètres

## 🌍 Internationalisation

Langue par défaut : **Français (fr-FR)**

Utilisation :
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Text>{t('auth.login')}</Text>
```

## 🔒 Permissions (CASL)

Les permissions sont gérées via CASL :
```typescript
import { useAbility } from '../permissions/AbilityProvider';

const ability = useAbility();
if (ability.can('export', 'Report')) {
  // Afficher le bouton d'export
}
```

## 📡 API

### Endpoints implémentés
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Déconnexion
- `GET /events` - Liste des événements
- `GET /events/:id` - Détails d'un événement
- `GET /attendees` - Liste des participants
- `GET /attendees/:id` - Détails d'un participant
- `POST /attendees` - Créer un participant
- `PATCH /attendees/:id` - Modifier un participant
- `POST /attendees/:id/check-in` - Check-in
- `POST /attendees/:id/print` - Marquer badge imprimé

## 🎯 Fonctionnalités Principales

### ✅ Implémentées
- Authentification sécurisée avec refresh token
- Liste des événements (à venir / passés)
- Navigation dans un événement
- Liste des participants
- Détails d'un participant
- Bottom tab flottante (style ancien app)
- Système de thème (clair/sombre/système)
- Internationalisation (français)
- Gestion des permissions

### 🚧 À Implémenter
- Scan QR Code (caméra)
- Check-in des participants
- Impression de badges
- Top tabs (GuestLists / Sessions)
- Swipeable rows (Print / Check-in)
- Animations Reanimated
- Gestion des sessions
- Statistiques en temps réel

## 🎨 Design

L'application s'inspire des captures fournies :
- **Couleurs** : Vert brand (#16a34a), gris neutres
- **Bottom tab** : Fond noir/gris foncé, bouton Scan central vert
- **Cards** : Coins arrondis, ombres douces, coin incliné gris
- **Typographie** : Système par défaut, poids variés

## 🛠️ Décisions Techniques

### Pourquoi Expo ?
- Développement rapide
- Accès natif simplifié (caméra, stockage sécurisé)
- Hot reload
- Build cloud

### Pourquoi NativeWind ?
- Syntaxe Tailwind familière
- Performance native
- Thème dynamique

### Pourquoi Redux Toolkit ?
- État global prévisible
- DevTools puissants
- Thunks pour async

### Pourquoi Axios ?
- Intercepteurs pour auth
- Gestion centralisée des erreurs
- Timeout et retry

## 📝 TODO

### Phase suivante
- [ ] Implémenter le scan QR Code
- [ ] Ajouter les animations Reanimated
- [ ] Créer les SwipeableRow (Print/Check-in)
- [ ] Implémenter les top tabs (GuestLists/Sessions)
- [ ] Ajouter la gestion des sessions
- [ ] Implémenter l'impression de badges
- [ ] Ajouter les tests unitaires
- [ ] Optimiser les performances
- [ ] Ajouter les notifications push

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est privé et propriétaire.

## 👥 Auteurs

- **Rabie Gharghar** - [GitHub](https://github.com/Rabiegha)

## 🙏 Remerciements

- Design inspiré de l'ancienne application mobile
- Tokens de design de la web app Attendee EMS
