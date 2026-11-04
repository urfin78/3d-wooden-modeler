# Kräutertrockner 340×340 mm

Stapelbarer Kräutertrockner, 4 Rahmen + Deckel, Verbindung über Ø6-Dübel.
Modell: `herb-dryer.woodmodel.json`

## Maße

- Grundfläche: 340 × 340 mm
- Höhe offen (mit Dübel-Abstand): 308 mm (4 Rahmen × 47 mm + 3 × 30 mm Spalt + Deckel)
- Spalt zwischen Rahmen: 30 mm

## Stückliste

### Rahmenbretter — Leiste 47×13,5 mm

| Stück | Länge | Verwendung |
|---|---|---|
| 8 | 340 mm | Längsbretter (2 pro Rahmen × 4 Rahmen) |
| 8 | 313 mm | Stirnbretter (2 pro Rahmen × 4 Rahmen) |

**Netto-Bedarf: 5224 mm**

Bohrungen pro Längsbrett: **4 Löcher** (2 pro Ende, nebeneinander), mittig auf 13,5 mm Brettdicke,
an den Positionen 15 mm und 35 mm von der jeweiligen Stirnkante:

- **Dübelsitz** (ein Loch pro Ende): von oben 20 mm tief gebohrt (hier wird der Dübel eingeklebt),
  von unten 10 mm tief (nimmt im Stapelmodus den Dübel des darunterliegenden Rahmens auf).
- **Durchgangsloch** (das zweite Loch daneben): Ø6 durchgehend — versteckt im Stapelmodus den
  herausragenden Dübel des unteren Rahmens.

**Alle Längsbretter (vorne wie hinten) sind identisch gebohrt** — das ist die Voraussetzung
dafür, dass sich die Etagen beliebig tauschen lassen. Pro Brett:

- **Linkes Ende:** Dübelsitz **außen** (15 mm) + Durchgangsloch **innen** (35 mm)
- **Rechtes Ende:** Dübelsitz **innen** (35 mm) + Durchgangsloch **außen** (15 mm)

Dadurch hat jedes Brett einen Dübel außen und einen innen. Der eingeklebte Dübel sitzt also
links außen und rechts innen.

Der Umschalt-Trick steckt allein in der **Verteilung** von Sitz und Durchgang über die vier Ecken:
Sie ist so gewählt, dass die 180°-Drehung (Punktspiegelung um die Rahmenmitte) an jeder
Dübel-Position Sitz und Durchgang vertauscht. Da das Loch**muster** dabei symmetrisch bleibt,
sind alle Rahmen untereinander gleich und in beliebiger Reihenfolge stapelbar.

- **Lüft-Modus** (zwei Rahmen gleich orientiert): Dübel des unteren Rahmens trifft den Dübelsitz
  des oberen → Rahmen hängt 10 mm tief auf den Dübeln, 30 mm Spalt bleibt offen.
- **Stapel-Modus** (oberer Rahmen um 180° gedreht): Dübel trifft das Durchgangsloch und
  verschwindet darin → Rahmen liegt direkt auf.

### Eckleisten — Vierkant 20×20 mm

| Stück | Länge | Verwendung |
|---|---|---|
| 16 | 47 mm | Innenecke jedes Rahmens (4 pro Rahmen × 4 Rahmen), volle Rahmenhöhe |

**Netto-Bedarf: 752 mm**

Die 20×20-Leiste sitzt bündig in der Innenecke der beiden Außenbretter und läuft über die
gesamte Rahmenhöhe (47 mm) — mehr Klebefläche als die frühere 10×10×30-Variante.

### Deckel / Bodenplatte

| Stück | Maße | Material |
|---|---|---|
| 1 | 340 × 340 × 6 mm | Sperrholz / Multiplex |

### Verbindungs-Dübel — Rundstab Ø6 mm

| Stück | Länge | Verwendung |
|---|---|---|
| 12 | 60 mm | 4 Ecken × 3 Zwischenräume |

**Netto-Bedarf: 720 mm**

### Tablettboden (nicht im 3D-Modell)

| Stück | Maße | Material |
|---|---|---|
| 4 | ca. 313 × 313 mm | Stoff / Gaze / Netz |

## Material-Optionen mit Preisvergleich (inkl. Kerf 3 mm)

### Rahmen-Leiste 47×13,5

Netto-Bedarf 5224 mm (8× 340 + 8× 313). 3× 2000 mm = 6000 mm Rohmaterial.

| Variante | Zuschnitt | Stück | Gesamt | Verschnitt |
|---|---|---|---|---|
| **3× 2000 mm × 7,29 €** | 340+340+340+313+313 / 340+340+340+313+313 / 340+340+313+313+313+313 | 3 | **21,87 €** | 342 / 342 / 53 mm |

**Empfehlung: 3× 2000 mm — 5224 mm netto plus Kerf passen bequem in 6000 mm; die dritte Leiste endet bei 1947 mm (53 mm Rest).**

### Vierkantleiste 20×20

Netto-Bedarf 752 mm (16× 47 mm). 1 Stück 900 mm reicht völlig (~148 mm Rest).

| Variante | Stück | Stückpreis | Gesamt | Verschnitt |
|---|---|---|---|---|
| **900 mm** | 1 | _Preis prüfen_ | **TBD** | ~148 mm Rest |

**Hinweis:** Preis für 20×20×900 noch offen (sourcePrice im Modell = 0).

## Gesamtpreis (4 Rahmen + Deckel)

| Position | Preis |
|---|---|
| Rahmen-Leiste (3× 2000 mm × 7,29 €) | 21,87 € |
| Eckleiste (1× 20×20×900 mm) | _Preis prüfen_ |
| Sperrholz Pappel 340×340×6 mm | 3,50 € |
| Rundstab Buche Ø6 × 1000 mm | 1,65 € |
| Stoff / Netz für 4 Tabletts | ~5,00 € |
| **Summe** | **~32,02 € + Eckleiste** |

Hinweis: Deckel ist 6 mm Pappel-Sperrholz (statt 10 mm im Modell).
Rundstab Ø6 × 1000 mm reicht auch für 5. Rahmen.

## Erweiterung auf 5 Rahmen

Reststücke (342 + 342 + 53 mm = 737 mm) reichen nicht für einen 5. Rahmen (Bedarf 2× 340 + 2× 313 = 1306 mm) — 1 zusätzliche Leiste nötig.
Zusätzlich nötig: 4× Ø6 × 60 mm Dübel (im 1-m-Stab eh dabei).
→ **Mehrpreis: 7,29 €** (1 weitere Leiste 2000 mm)

## Zusammenbau-Hinweise

- Rahmen-Eckverbindung über innenliegende 20×20×47 Vierkantleisten über die volle Rahmenhöhe (geleimt + ggf. mit kurzen Schrauben durchs Außenbrett)
- Stoff/Netz mit Tackerklammern von unten an die Rahmen-Unterseite spannen
- Dübel (Ø6 × 60 mm) werden fest in den **Dübelsitz** (20-mm-Loch von oben) geleimt: 20 mm tief, 40 mm ragen heraus
- Die 40 mm verteilen sich: 30 mm Spalt + 10 mm Eingriff ins 10-mm-Loch (von unten) des darüberliegenden Rahmens (Brettdicke 13,5 mm)
- Pro Ecke sitzt **neben** dem Dübelsitz ein durchgehendes Loch; alle Längsbretter sind gleich gebohrt (Sitz links außen / rechts innen)
- Rahmen um 180° drehen (horizontal), um umzuschalten:
  - Normal (nicht gedreht): Dübel trifft Dübelsitz → Rahmen hängt auf Dübeln (Lüft-Modus, offen, 30 mm Spalt)
  - Gedreht 180°: Dübel trifft das Durchgangsloch und verschwindet darin → Rahmen liegt direkt auf (Stapel-Modus, geschlossen)
