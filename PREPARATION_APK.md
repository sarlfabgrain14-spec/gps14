# Guide de Préparation APK pour GPS14 v2.0.1

## 📱 Configuration Actuelle

L'application GPS14 est déjà configurée pour la compilation APK avec :

### ✅ Configurations Existantes

**1. app.json - Configuration de base**
```json
{
  "expo": {
    "name": "GPS14",
    "slug": "gps14",
    "version": "2.0.1",
    "android": {
      "package": "com.gpstracker.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#2196F3"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    }
  }
}
```

**2. Plugins Configurés**
- ✅ expo-router
- ✅ expo-location
- ✅ expo-notifications
- ✅ expo-splash-screen

**3. Permissions Android**
- ✅ Localisation (GPS)
- ✅ Notifications Push
- ✅ Vibration
- ✅ Boot Completed (pour notifications)

---

## 🛠️ Étapes pour Compiler l'APK

### Option 1 : Build Cloud EAS (Recommandé)

```bash
# 1. Installer EAS CLI globalement
npm install -g eas-cli

# 2. Se connecter à Expo
eas login

# 3. Configurer le projet
cd /app/frontend
eas build:configure

# 4. Lancer le build APK
eas build --platform android --profile preview

# Le fichier APK sera disponible sur expo.dev
```

### Option 2 : Build Local avec expo-dev-client

```bash
# 1. Installer les outils Android
# Nécessite : Android Studio, SDK, Java JDK

# 2. Créer un build de développement
cd /app/frontend
npx expo run:android

# 3. Générer l'APK
cd android
./gradlew assembleRelease

# APK généré : android/app/build/outputs/apk/release/app-release.apk
```

---

## 📋 Checklist Avant Build

### Configuration

- [x] Version correcte dans app.json (2.0.1)
- [x] Package name unique (com.gpstracker.app)
- [x] Icônes configurées (icon.png, adaptive-icon.png)
- [x] Splash screen configuré
- [x] Permissions Android listées
- [x] Plugins nécessaires ajoutés

### Fonctionnalités

- [x] Carte avec 3 types (Leaflet, ArcGIS, Mapbox)
- [x] Flèches directionnelles réduites
- [x] Navigation véhicules → map
- [x] Événements avec navigation
- [x] Historique avec DatePicker
- [x] Notifications configurées
- [x] Préférences sauvegardées

### Tests Requis

- [ ] Tester sur un appareil Android physique
- [ ] Vérifier les permissions au premier lancement
- [ ] Tester toutes les fonctionnalités offline/online
- [ ] Vérifier la rotation d'écran
- [ ] Tester les notifications en arrière-plan

---

## 🔑 Configuration Signing (Pour Production)

### 1. Générer une Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore gps14-release.keystore \
  -alias gps14-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configurer gradle.properties

```properties
MYAPP_UPLOAD_STORE_FILE=gps14-release.keystore
MYAPP_UPLOAD_KEY_ALIAS=gps14-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=****
MYAPP_UPLOAD_KEY_PASSWORD=****
```

### 3. Mettre à jour android/app/build.gradle

```gradle
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

---

## 📦 Optimisations APK

### Réduire la Taille

**1. Activer ProGuard/R8**
```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

**2. Activer les App Bundles (AAB)**
```bash
eas build --platform android --profile production
# Génère un .aab au lieu d'un .apk
```

**3. Splits par Architecture**
```gradle
splits {
    abi {
        enable true
        reset()
        include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        universalApk false
    }
}
```

---

## 🚀 Distribution

### Google Play Store

1. Créer un compte développeur ($25 one-time)
2. Créer une nouvelle application
3. Remplir les métadonnées
4. Uploader l'APK/AAB
5. Configurer les tests (internal/closed/open)
6. Publier

### Distribution Directe

1. Héberger l'APK sur un serveur
2. Partager le lien de téléchargement
3. Les utilisateurs doivent activer "Sources inconnues"

---

## ⚠️ Notes Importantes

### Limitations Expo Go

Les notifications push ne fonctionneront PAS dans Expo Go.
**Solution :** Utiliser `expo-dev-client` pour un build de développement.

### API Keys

- OpenStreetMap : Pas besoin de clé
- ArcGIS : Gratuit, pas besoin de clé
- Mapbox : Token public déjà inclus (pk.eyJ1...)

### Backend API

L'application se connecte à :
```
https://tracking.gps-14.net/api/api.php
```

Aucune configuration backend nécessaire côté app.

---

## 📱 Taille Estimée de l'APK

- **APK Universal :** ~50-60 MB
- **APK Split (arm64-v8a) :** ~35-40 MB
- **AAB (Google Play) :** ~45-50 MB

---

## 🐛 Résolution de Problèmes

### Erreur : "Unable to load script"

```bash
# Nettoyer le cache
cd /app/frontend
rm -rf .expo node_modules/.cache
yarn install
```

### Erreur : "Java version incorrect"

```bash
# Vérifier la version de Java
java -version
# Requis : Java 11 ou 17

# Installer Java 17
sudo apt-get install openjdk-17-jdk
```

### Erreur : "Android SDK not found"

```bash
# Installer Android Studio
# Configurer ANDROID_HOME dans .bashrc :
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## ✅ Prêt pour le Build !

L'application GPS14 v2.0.1 est maintenant prête pour la compilation APK.

**Commande recommandée :**
```bash
cd /app/frontend
eas build --platform android --profile preview
```

Cette commande générera un APK installable directement sur les appareils Android.
