# Convertir un AAB en APK

Guide pour convertir un Android App Bundle (.aab) en APK installable (.apk) sur macOS.

## Prérequis

### 1. Java (JDK 17+)

Vérifier si Java est installé :

```bash
java -version
```

Si pas installé, télécharger depuis https://www.oracle.com/java/technologies/downloads/

### 2. Bundletool

Bundletool est l'outil officiel de Google pour manipuler les .aab.

```bash
# Télécharger bundletool (pas besoin de brew)
curl -L -o /usr/local/bin/bundletool.jar \
  https://github.com/google/bundletool/releases/download/1.17.2/bundletool-all-1.17.2.jar
```

Vérifier que ça marche :

```bash
java -jar /usr/local/bin/bundletool.jar version
```

---

## Convertir un AAB en APK

### Commande rapide (APK universel, signé debug)

```bash
java -jar /usr/local/bin/bundletool.jar build-apks \
  --bundle=~/Downloads/mon-fichier.aab \
  --output=~/Downloads/app.apks \
  --mode=universal
```

Puis extraire l'APK :

```bash
unzip ~/Downloads/app.apks -d ~/Downloads/output \
  && mv ~/Downloads/output/universal.apk ~/Downloads/app.apk \
  && rm -rf ~/Downloads/output ~/Downloads/app.apks
```

L'APK est dans `~/Downloads/app.apk`.

### Avec signature production (keystore)

Si tu as besoin d'un APK signé avec la clé de production :

```bash
java -jar /usr/local/bin/bundletool.jar build-apks \
  --bundle=~/Downloads/mon-fichier.aab \
  --output=~/Downloads/app.apks \
  --mode=universal \
  --ks=chemin/vers/keystore.jks \
  --ks-key-alias=ton-alias \
  --ks-pass=pass:ton-mot-de-passe
```

> Pour récupérer le keystore EAS : `eas credentials --platform android` → choisir le profil → Download Keystore

---

## Alternative : builder un APK directement avec EAS

Pas besoin de convertir, tu peux générer un APK directement :

```bash
# APK production (distribution interne)
eas build --profile production-apk --platform android

# APK preview (test)
eas build --profile preview --platform android
```

Ces profils sont déjà configurés dans `eas.json`.

---

## Récap des formats

| Format | Usage | Généré par |
|--------|-------|------------|
| `.aab` | Upload sur le Play Store | `eas build --profile production` |
| `.apk` | Installation directe sur un téléphone | `eas build --profile production-apk` ou conversion via bundletool |

---

## Troubleshooting

**`Error: app.apks already exists`**
→ Supprimer l'ancien fichier : `rm ~/Downloads/app.apks`

**`java: command not found`**
→ Installer Java : https://www.oracle.com/java/technologies/downloads/

**`brew install bundletool` échoue sur macOS 13 (Ventura)**
→ Utiliser la méthode manuelle avec `curl` décrite ci-dessus.
