# Formulaires dynamiques

## Vue d'ensemble

L'application mobile utilise maintenant un système de formulaires dynamiques qui s'adapte à la configuration de chaque événement, exactement comme sur le site web.

## Comment ça fonctionne

### Backend

Chaque événement a un champ `registration_fields` (JSON) dans sa table `event_settings` qui définit les champs du formulaire d'inscription.

Structure d'un champ :
```json
{
  "id": "email",
  "type": "email",
  "label": "Email",
  "placeholder": "email@example.com",
  "required": true,
  "attendeeField": "email"
}
```

**Types de champs supportés :**
- `text` : Texte simple
- `email` : Email avec validation
- `tel` : Numéro de téléphone
- `number` : Nombre
- `textarea` : Zone de texte multiligne
- `select` : Liste déroulante (rendue avec des boutons horizontaux)
- `attendee_type` : Sélection du type de participant

**Propriétés d'un champ :**
- `id` : Identifiant unique du champ
- `type` : Type du champ (voir ci-dessus)
- `label` : Libellé affiché
- `placeholder` : Texte d'aide
- `required` : true/false si le champ est obligatoire
- `attendeeField` : Si défini, le champ est mappé sur un champ de la table `attendees` (camelCase → snake_case)
- `registrationField` : Si défini, le champ est mappé sur un champ de la table `registrations`
- `storeInAnswers` : Si true, la valeur est stockée dans le champ JSON `answers` de la registration
- `key` : Clé utilisée dans `answers` si `storeInAnswers` est true
- `options` : Pour les champs `select`, liste des options avec `value` et `label`

### Mobile

#### Service API (`events.service.ts`)
```typescript
getEventRegistrationFields: async (eventId: string) => {
  const response = await axiosClient.get(`/events/${eventId}`);
  return response.data.settings?.registration_fields || [];
}
```

#### Redux (`events.slice.ts`)
- State : `currentEventRegistrationFields` (array)
- Action : `fetchEventRegistrationFieldsThunk(eventId)`
- Loading state : `isLoadingRegistrationFields`

#### Écran (`AttendeeAddScreen.tsx`)
1. Au montage, charge les champs : `dispatch(fetchEventRegistrationFieldsThunk(eventId))`
2. Affiche un loader pendant le chargement
3. Rend dynamiquement chaque champ via `renderField(field)`
4. À la soumission, mappe les valeurs selon `attendeeField`, `registrationField` ou `storeInAnswers`

## Exemple de configuration

Configuration web typique :
```json
[
  {
    "id": "email",
    "type": "email",
    "label": "Email",
    "placeholder": "email@example.com",
    "required": true,
    "attendeeField": "email"
  },
  {
    "id": "firstName",
    "type": "text",
    "label": "Prénom",
    "placeholder": "Votre prénom",
    "required": true,
    "attendeeField": "firstName"
  },
  {
    "id": "lastName",
    "type": "text",
    "label": "Nom",
    "placeholder": "Votre nom",
    "required": true,
    "attendeeField": "lastName"
  },
  {
    "id": "phone",
    "type": "tel",
    "label": "Téléphone",
    "placeholder": "+33 6 12 34 56 78",
    "required": false,
    "attendeeField": "phone"
  },
  {
    "id": "attendee_type",
    "type": "attendee_type",
    "label": "Type de participant",
    "required": true,
    "registrationField": "event_attendee_type_id"
  }
]
```

## Mapping des données

Au moment de la soumission, les données sont organisées comme suit :

```typescript
const attendee = {}; // Champs avec attendeeField (camelCase → snake_case)
const registrationData = {}; // Champs avec registrationField
const answers = {}; // Champs avec storeInAnswers

// Exemple de payload final :
{
  attendee: {
    email: "john@example.com",
    first_name: "John",
    last_name: "Doe",
    phone: "+33612345678"
  },
  attendance_type: "onsite",
  source: "mobile_app",
  event_attendee_type_id: "uuid-type",
  answers: {
    custom_question: "Réponse personnalisée"
  }
}
```

## Avantages

✅ **Cohérence** : Même système que le site web  
✅ **Flexibilité** : Chaque événement peut avoir des champs différents  
✅ **Maintenabilité** : Pas besoin de modifier le code mobile pour ajouter des champs  
✅ **UX** : Le formulaire s'adapte automatiquement à chaque événement

## Notes techniques

- Les champs `select` sont rendus avec des boutons horizontaux scrollables au lieu d'un picker natif pour une meilleure UX
- Les champs `attendee_type` chargent dynamiquement les types configurés pour l'événement
- La validation se fait côté client (champs required) et côté serveur
- Le mapping camelCase → snake_case est automatique pour `attendeeField`
