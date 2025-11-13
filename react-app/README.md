# TRA zu KML Konverter - React Web App

Eine moderne Web-Anwendung zum Konvertieren von TRA-Trassendateien in das KML-Format für Google Earth.

## Features

- 🎯 **Drag & Drop**: Einfaches Hochladen von TRA-Dateien per Drag & Drop
- 🗺️ **Interaktive Karte**: Visualisierung der Trasse auf einer Leaflet-Karte
- 📊 **Datenansicht**: Tabellarische Darstellung aller Datenpunkte
- ✅ **Selektive Auswahl**: Auswahl einzelner Punkte für den Export
- 🎨 **Modernes Design**: Responsives UI mit Tailwind CSS
- 📥 **KML Export**: Export als KML-Datei für Google Earth
- 🔄 **Koordinatentransformation**: Automatische Umrechnung von Gauß-Krüger zu WGS84

## Technologie-Stack

- **React 18** - UI Framework
- **Vite** - Build Tool & Dev Server
- **Tailwind CSS** - Styling
- **Leaflet** - Kartenvisualisierung
- **Proj4js** - Koordinatentransformation
- **Lucide React** - Icons

## Installation

### Voraussetzungen

- Node.js 18 oder höher
- npm oder yarn

### Setup

1. In das Projektverzeichnis wechseln:
```bash
cd react-app
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5173` erreichbar.

## Build für Produktion

Zum Erstellen einer optimierten Production-Build:

```bash
npm run build
```

Die fertigen Dateien befinden sich dann im `dist/` Ordner.

## Deployment als GitHub Page

1. Build erstellen:
```bash
npm run build
```

2. Den Inhalt des `dist/` Ordners in den `gh-pages` Branch pushen:
```bash
# Erstelle gh-pages Branch falls nicht vorhanden
git checkout --orphan gh-pages
git rm -rf .
cp -r react-app/dist/* .
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

3. In den GitHub Repository-Einstellungen unter "Pages" den `gh-pages` Branch als Source auswählen.

## Verwendung

1. **GK-Zone auswählen**: Wählen Sie die passende Gauß-Krüger-Zone (2, 3, 4 oder 5) aus
2. **TRA-Datei laden**: Laden Sie eine .tra-Datei per Drag & Drop oder Klick hoch
3. **Punkte auswählen**: Wählen Sie in der Tabelle die gewünschten Datenpunkte aus
4. **Exportieren**: Klicken Sie auf "KML exportieren" um die KML-Datei herunterzuladen

## TRA-Dateiformat

Die Anwendung unterstützt TRA-Binärdateien mit folgender Struktur (78 Bytes pro Datensatz):
- Radius 1 & 2 (je 8 Bytes)
- Rechtswert (Y) und Hochwert (X) (je 8 Bytes)
- Richtung und Station (je 8 Bytes)
- Element-Typ (2 Bytes)
- Länge und Überhöhungen (je 8 Bytes)
- Abstand zur Route (4 Bytes)

## Gauß-Krüger Zonen

Die Anwendung unterstützt folgende GK-Zonen:
- **Zone 2**: 6°E (x_0=2500000)
- **Zone 3**: 9°E (x_0=3500000)
- **Zone 4**: 12°E (x_0=4500000)
- **Zone 5**: 15°E (x_0=5500000)

Alle Zonen verwenden das Bessel-Ellipsoid mit DHDN-Transformation zu WGS84.

## Hinweis zu WMS

Die Original-Python-Anwendung verwendet einen WMS-Service mit Basic Authentication. 
In der Browser-Version wird standardmäßig OpenStreetMap als Kartenhintergrund verwendet, 
da Browser-basierte WMS-Authentifizierung spezielle Proxy-Konfigurationen erfordert.

Für die Verwendung des authentifizierten WMS-Services müssten Sie:
- Einen Proxy-Server einrichten
- CORS-Header konfigurieren
- Die Authentifizierung serverseitig handhaben

## Lizenz

Dieses Projekt ist für die Verwendung durch DB Netz AG bestimmt.

## Support

Bei Fragen oder Problemen wenden Sie sich bitte an den Repository-Betreuer.

