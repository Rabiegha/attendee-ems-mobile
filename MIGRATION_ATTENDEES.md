# Migration Architecture Attendees

## Changements effectués

### 1. Restructuration des dossiers

#### Avant:
```
/screens/Attendees/
  - AttendeesListScreen.tsx
  - AttendeeDetailsScreen.tsx
```

#### Après:
```
/screens/EventDashboard/
  - AttendeesListScreen.tsx (déplacé)
  - AttendeeDetailsScreen.tsx (déplacé)
  - GuestListScreen.tsx (wrapper)
  - EventDashboardScreen.tsx
  - SessionsScreen.tsx

/screens/Attendees/
  - AttendeeAddScreen.tsx (nouveau)
```

### 2. Nouveaux types créés

**`/types/attendee.ts`** - Mise à jour complète:
- `Attendee` - Structure de l'attendee de l'API
- `Registration` - Structure de la registration (inscription à un événement)
- `RegistrationsResponse` - Réponse API avec pagination

### 3. Nouvelle API

**`/api/registrations.service.ts`** - Service pour les registrations:
- `GET /events/{eventId}/registrations` - Liste des inscriptions
- `GET /events/{eventId}/registrations/:id` - Détail d'une inscription
- `POST /events/{eventId}/registrations/:id/check-in` - Check-in
- `POST /events/{eventId}/registrations/:id/print-badge` - Imprimer badge

### 4. Nouveau Redux Slice

**`/store/registrations.slice.ts`** - Gestion d'état pour les registrations:
- `fetchRegistrationsThunk` - Charger les inscriptions
- `fetchRegistrationByIdThunk` - Charger une inscription
- `checkInRegistrationThunk` - Check-in
- `markBadgePrintedThunk` - Marquer badge imprimé

### 5. Fonctionnalités ajoutées

#### AttendeesListScreen (EventDashboard):
- ✅ Swipeable items avec actions Print/Check
- ✅ Barre de progression (checked-in/total)
- ✅ SearchBar réutilisable
- ✅ Cards réutilisables
- ✅ Coin coloré dynamique (gris pour approved, jaune pour checked-in)
- ✅ Couleurs adaptées au mode light/dark
- ✅ Pull-to-refresh

#### AttendeeDetailsScreen (EventDashboard):
- ✅ Affichage complet des informations
- ✅ Boutons Print et Check-in
- ✅ Status avec couleur dynamique
- ✅ Support des nouveaux champs (country, job_title, etc.)

#### AttendeeAddScreen (Attendees):
- ✅ Formulaire d'ajout simple
- ✅ Champs: prénom, nom, email, téléphone, entreprise, poste
- ✅ Validation de base
- ✅ Design cohérent avec le reste de l'app

### 6. Navigation

Le flow de navigation est maintenant:
```
EventDashboard (Top Tabs)
  ├─ GuestList (wrapper)
  │   └─ AttendeesListScreen
  │       └─ AttendeeDetailsScreen
  └─ Sessions
```

### 7. Données API

Structure de réponse attendue:
```json
{
  "data": [
    {
      "id": "registration-id",
      "status": "approved" | "checked-in" | "pending" | "rejected",
      "attendance_type": "onsite" | "online",
      "attendee": {
        "id": "attendee-id",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "company": "TechCorp",
        "job_title": "Developer",
        ...
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 147,
    "totalPages": 8
  }
}
```

## Actions requises

### Backend:
- ✅ Endpoint déjà existant: `GET /events/{eventId}/registrations`
- ⚠️ À créer: `GET /events/{eventId}/registrations/:id`
- ⚠️ À créer: `POST /events/{eventId}/registrations/:id/check-in`
- ⚠️ À créer: `POST /events/{eventId}/registrations/:id/print-badge`

### Navigation:
- ⚠️ Mettre à jour les routes dans le navigator pour pointer vers les bons screens
- ⚠️ Supprimer les anciens fichiers dans `/screens/Attendees/` (sauf AttendeeAddScreen)

## Notes importantes

1. **Swipeable**: Utilise `react-native-gesture-handler` (déjà installé)
2. **Couleurs dynamiques**: Gris pour "approved", Jaune pour "checked-in"
3. **Barre de progression**: Calcule automatiquement le ratio checked-in/total
4. **Centralisation**: Toutes les données passent par le slice `registrations`
5. **Scalabilité**: Architecture prête pour ajouter plus de fonctionnalités
