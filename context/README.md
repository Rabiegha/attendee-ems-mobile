# Context Local — Mobile (attendee-ems-mobile)

## Principe

Ce dossier contient le contexte **spécifique à l'application mobile**.
Le contexte **transversal** (auth globale, contrats API, format d'erreurs, règles métier invariantes) se trouve dans le **Context Hub**.

> 🔗 Hub : `../context-hub/context/` (ou le chemin configuré via `--hub`)

## Ce qui va ici (local)
- Contraintes offline / sync
- Architecture mobile (navigation, stockage local)
- Conventions spécifiques React Native / Expo
- Décisions techniques propres au mobile (choix de libs, patterns)

## Ce qui va dans le Hub (transversal)
- Format de réponse API (data-contracts)
- Stratégie auth (ADR-001)
- Format d'erreurs (ADR-002)
- Règles métier invariantes
- Baseline sécurité

## Règle PR
> Si ta PR contient une décision non triviale → crée un ADR ou mets le contexte à jour.
> Utilise le template de PR avec la section "Context / Decisions".

## Utilisation

```bash
# Voir le contexte Mobile (hub + local)
node scripts/get-context.js "mobile/*" --hub ../context-hub/context

# Scope ciblé
node scripts/get-context.js mobile/offline --hub ../context-hub/context --format bundle
```
