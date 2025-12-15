# GPS14 - Version Stable avec Leaflet
**Date:** 15 Décembre 2024
**Version:** 1.0.0-leaflet

## ✅ Fonctionnalités Complètes

### 🗺️ Carte Interactive (Leaflet via WebView)
- Affichage de tous les véhicules en temps réel
- Marqueurs colorés (Vert = en mouvement, Rouge = arrêté)
- Popup avec détails au clic
- Auto-zoom pour voir tous les véhicules
- Actualisation automatique toutes les 10 secondes
- Fonctionne sur Web ET Mobile

### 🚗 Liste des Véhicules
- Affichage de tous les véhicules avec statut
- Vitesse en temps réel
- Dernière mise à jour
- Pull-to-refresh
- Navigation vers détails du véhicule

### 📊 Événements
- Filtres temporels (30min, 12h, 7j)
- Affichage des événements système
- Actualisation automatique toutes les 30s
- Icônes colorées selon type d'événement

### 📍 Historique des Trajets
- Sélection 1, 3 ou 7 jours
- Statistiques : Distance, Durée, Vitesse Max/Moyenne
- Liste des points de trajet
- Bouton pour ouvrir dans Google Maps

### 🌐 Traductions Multilingues
- Support complet : Anglais, Français, Arabe
- Sélecteur sur l'écran de connexion
- Appliqué à toute l'application
- Sauvegarde de la préférence

### 🔐 Authentification
- Connexion avec username/password
- API : https://tracking.gps-14.net
- Gestion de session avec Zustand
- Déconnexion sécurisée

## 📦 Architecture Technique

### Stack
- **Frontend:** React Native + Expo
- **Routing:** expo-router (file-based)
- **State:** Zustand
- **Queries:** @tanstack/react-query
- **Maps:** Leaflet (via WebView + CDN)
- **API:** Axios

### Structure des Fichiers
```
/app/frontend/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Configuration des tabs
│   │   ├── map.tsx           # Carte avec Leaflet
│   │   ├── vehicles.tsx      # Liste des véhicules
│   │   ├── events.tsx        # Événements système
│   │   └── more.tsx          # Menu Plus
│   ├── index.tsx             # Point d'entrée
│   ├── login.tsx             # Écran de connexion
│   ├── history.tsx           # Historique des trajets
│   └── vehicle-detail.tsx    # Détails d'un véhicule
├── components/
│   └── LeafletMap.tsx        # Composant carte Leaflet
├── services/
│   └── api.ts                # Service API
├── stores/
│   ├── authStore.ts          # Authentification
│   ├── languageStore.ts      # Langue
│   └── vehicleStore.ts       # Véhicules
└── utils/
    └── translations.ts       # Traductions

### Dépendances Clés
```json
{
  "react-native-webview": "13.13.5",
  "@tanstack/react-query": "^5.90.12",
  "zustand": "^5.0.9",
  "axios": "^1.13.2",
  "expo-router": "~5.1.4"
}
```

## 🔧 Configuration API

### Endpoints
- **Base URL:** https://tracking.gps-14.net/api/api.php
- **Commandes:**
  - `USER_GET_OBJECTS` - Liste des véhicules
  - `OBJECT_GET_LOCATIONS` - Positions en temps réel
  - `OBJECT_GET_LAST_EVENTS_*` - Événements
  - `OBJECT_GET_ROUTE` - Historique des trajets

### Authentification
- Type: API Key
- Obtenue via login username/password
- Stockée dans Zustand authStore

## 🎨 Design

### Couleurs Principales
- Primaire: #2196F3 (Bleu)
- Succès: #4CAF50 (Vert)
- Danger: #F44336 (Rouge)
- Fond: #f5f5f5 (Gris clair)

### Icônes
- Bibliothèque: @expo/vector-icons (Ionicons)
- Cohérence sur toute l'application

## 🧪 Tests

### Identifiants de Test
- **Username:** picanto
- **Password:** picanto

### Plateformes Testées
- ✅ Web (Navigateur)
- ✅ Android (Expo Go)
- ✅ iOS (Expo Go)

## 📝 Notes Importantes

### Leaflet via WebView
- Chargement depuis CDN: https://unpkg.com/leaflet@1.9.4/
- Pas de dépendances npm leaflet/react-leaflet
- Évite les problèmes de build native
- Communication avec React Native via `postMessage`

### OpenStreetMap
- Tuiles gratuites : https://{s}.tile.openstreetmap.org/
- Attribution requise : © OpenStreetMap contributors
- Pas de limite d'utilisation pour usage normal

### Actualisation des Données
- **Véhicules:** Toutes les 10 secondes
- **Événements:** Toutes les 30 secondes
- **Manuel:** Boutons de refresh disponibles

## 🚀 Démarrage

### Développement
```bash
cd /app/frontend
yarn install
yarn start
```

### Build
```bash
# Web
expo build:web

# Mobile
expo build:android
expo build:ios
```

## 📞 Support

### API Externe
- Provider: GPS-14.NET
- URL: https://tracking.gps-14.net

### Documentation
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- Leaflet: https://leafletjs.com/

---

**✅ Version stable et fonctionnelle - Prête pour production**
