# Structure API - PrintNode Integration

## 📁 Structure des dossiers

```
src/
├── api/
│   ├── backend/                    # Services API Backend (ancien emplacement: src/api/)
│   │   ├── attendees.service.ts
│   │   ├── auth.service.ts
│   │   ├── axiosClient.ts
│   │   ├── events.service.ts
│   │   ├── registrations.service.ts
│   │   └── index.ts               # Export de tous les services backend
│   │
│   ├── printNode/                  # Services API PrintNode (NOUVEAU)
│   │   ├── printers.service.ts    # Service pour les imprimantes et jobs d'impression
│   │   └── index.ts               # Export de tous les services PrintNode
│   │
│   └── index.ts                    # Export global de tous les services API
│
├── config/
│   ├── config.ts                   # Configuration générale (URLs API)
│   └── printNodeApi.ts             # Configuration client Axios PrintNode
│
└── utils/
    └── api/
        └── handleApiError.ts       # Utilitaire de gestion d'erreurs API
```

## 🔧 Services PrintNode créés

### `printers.service.ts`

**Fonctions disponibles :**
- `getNodePrinters()` - Récupère toutes les imprimantes
- `getNodePrinter(printerId)` - Récupère une imprimante spécifique
- `sendPrintJob(printJob)` - Envoie un job d'impression
- `getPrintJobs()` - Récupère tous les jobs d'impression
- `getPrintJob(printJobId)` - Récupère un job d'impression spécifique

**Types TypeScript :**
- `Printer` - Interface pour les imprimantes
- `PrintJob` - Interface pour les jobs d'impression
- `PrintJobResponse` - Interface pour les réponses de jobs

## 📝 Utilisation

### Import des services

```typescript
// Import depuis le dossier API principal
import { getNodePrinters, sendPrintJob } from '../api/printNode';

// OU import direct
import { getNodePrinters, sendPrintJob } from '../api/printNode/printers.service';
```

### Exemple d'utilisation

```typescript
// Récupérer les imprimantes
const printers = await getNodePrinters();

// Envoyer un job d'impression
const printJob = {
  printerId: 123,
  title: 'Badge participant',
  contentType: 'pdf_base64',
  content: base64PdfContent,
  source: 'EMS Mobile App',
  options: {
    copies: 1,
    fitToPage: true,
  }
};

const result = await sendPrintJob(printJob);
```

## 🔐 Configuration PrintNode

La clé API PrintNode est configurée dans `src/config/printNodeApi.ts` :
- URL de base: `https://api.printnode.com`
- Authentification: Basic Auth avec clé API encodée en Base64

## ⚠️ Note importante

La clé API PrintNode est actuellement en dur dans le code. Pour la production, il est recommandé de :
1. Stocker la clé dans les variables d'environnement
2. Utiliser un système de gestion de secrets
3. Potentiellement passer par votre backend pour plus de sécurité

## 🔄 Migrations effectuées

Les imports suivants ont été mis à jour :
- `src/store/auth.slice.ts`
- `src/store/attendees.slice.ts`
- `src/store/events.slice.ts`
- `src/store/registrations.slice.ts`

Tous les imports pointent maintenant vers `../api/backend/` au lieu de `../api/`.
