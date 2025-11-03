#!/bin/bash
# Script RADICAL pour forcer Expo Go

# Tuer tous les processus
pkill -9 -f expo 2>/dev/null || true
pkill -9 -f metro 2>/dev/null || true

# Supprimer TOUS les caches
rm -rf .expo
rm -rf node_modules/.cache
rm -rf ~/.expo/development-client
rm -rf ~/.expo/DevClient
rm -rf ~/Library/Caches/Expo

# Variables d'environnement pour forcer Expo Go
export EXPO_USE_DEV_CLIENT=false
export EXPO_USE_DEVELOPMENT_BUILD=false

# Nettoyer npm
npm cache clean --force

# Démarrer Expo en mode Expo Go
echo "🚀 Démarrage FORCÉ en mode Expo Go..."
npx expo start --go --clear --non-interactive