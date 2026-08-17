# -*- coding: utf-8 -*-
"""
Mainfranken-Digital-Folienbausteine (Werkfilm-CI).

Übersetzt die Designsprache der Website in python-pptx-Bausteine:
Graphit-Grund, Silber-Text, Stahl-Akzente, Mono-Kicker in Versalien,
Maßketten-Trenner, Karten mit feiner Linie. Kein Schmuck ohne Funktion.

Verwendung:
    from mfd import *
    prs = neues_deck()
    s = folie(prs)
    kicker(s, "ANGEBOT", ...)
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.oxml.ns import qn

# ── Farbwelt (identisch zur Website) ────────────────────────────────
NACHT      = RGBColor(0x0D, 0x0F, 0x12)   # Seitengrund dunkel
FLAECHE    = RGBColor(0x14, 0x17, 0x1C)   # Karten dunkel
FLAECHE2   = RGBColor(0x1B, 0x1F, 0x26)   # abgesetzte Flächen dunkel
SILBER     = RGBColor(0xE9, 0xE7, 0xE2)   # Primärtext dunkel / Grund hell
NEBEL      = RGBColor(0xA8, 0xAE, 0xB6)   # Fließtext dunkel
GEDIMMT    = RGBColor(0x9A, 0xA0, 0xA8)   # Nebentext dunkel
STAHL      = RGBColor(0x8F, 0xA9, 0xBD)   # Akzent (Flächen, dunkler Modus)
STAHL_HELL = RGBColor(0xA7, 0xC0, 0xD2)
LINIE      = RGBColor(0x2B, 0x2F, 0x36)   # feine Linien dunkel
TINTE      = RGBColor(0x0D, 0x0F, 0x12)   # Text auf Stahl-Flächen

# Heller Beratungs-Modus (Tageslicht-Fassung derselben Welt)
PAPIER     = RGBColor(0xF4, 0xF3, 0xF0)   # Seitengrund hell (warmes Silberweiß)
KARTE_HELL = RGBColor(0xFC, 0xFB, 0xF9)   # Karten hell
GRAPHIT    = RGBColor(0x14, 0x17, 0x1C)   # Primärtext hell
SCHIEFER   = RGBColor(0x4A, 0x50, 0x58)   # Fließtext hell
GRAU_HELL  = RGBColor(0x7A, 0x80, 0x88)   # Nebentext hell
STAHL_TIEF = RGBColor(0x4F, 0x6E, 0x88)   # Akzent-Text auf hellem Grund
LINIE_HELL = RGBColor(0xD9, 0xD7, 0xD2)   # feine Linien hell

# ── Modus: 'dunkel' (Werkfilm) oder 'hell' (Beratung/Tageslicht) ─────
_THEMEN = {
    "dunkel": dict(grund=NACHT, karte=FLAECHE, karte2=FLAECHE2, text=SILBER,
                   fliess=NEBEL, gedimmt=GEDIMMT, akzent=STAHL, linie=LINIE,
                   cta_flaeche=STAHL, cta_text=TINTE),
    "hell": dict(grund=PAPIER, karte=KARTE_HELL, karte2=RGBColor(0xEC, 0xEA, 0xE6),
                 text=GRAPHIT, fliess=SCHIEFER, gedimmt=GRAU_HELL,
                 akzent=STAHL_TIEF, linie=LINIE_HELL,
                 cta_flaeche=STAHL_TIEF, cta_text=RGBColor(0xFC, 0xFB, 0xF9)),
}
THEMA = dict(_THEMEN["dunkel"])


def setze_modus(name):
    """Umschalten zwischen 'dunkel' (Werkfilm) und 'hell' (Beratung)."""
    THEMA.clear()
    THEMA.update(_THEMEN[name])

# ── Schriften ────────────────────────────────────────────────────────
DISPLAY = "Space Grotesk"   # Headlines, fett, Versalien
TEXT    = "Space Grotesk"   # Fließtext
MONO    = "Consolas"        # Zeichensprache: Kicker, Label, Fußzeile

# Folienformat 16:9
BREITE = Inches(13.333)
HOEHE = Inches(7.5)
RAND = Inches(0.83)         # Grundraster: linker/rechter Rand


def neues_deck():
    prs = Presentation()
    prs.slide_width = BREITE
    prs.slide_height = HOEHE
    return prs


def folie(prs, grund=None):
    """Leere Folie auf dem Grund des aktiven Modus."""
    s = prs.slides.add_slide(prs.slide_layouts[6])  # blank
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = grund or THEMA["grund"]
    return s


def _sperrung(run, hundertstel_pt):
    """Laufweite (Letterspacing) in 1/100 pt setzen — Kern der Zeichensprache."""
    run.font._rPr.set("spc", str(hundertstel_pt))


def _flach(shape):
    """Theme-Stilreferenz entfernen: keine geerbten Schatten/Effekte.
    Auf dunklem Grund unsichtbar, auf Papier stören sie sofort."""
    el = shape._element
    stil = el.find(qn("p:style"))
    if stil is not None:
        el.remove(stil)
    try:
        shape.shadow.inherit = False
    except (AttributeError, KeyError):
        pass


def textblock(s, x, y, w, h, zeilen, anker=MSO_ANCHOR.TOP):
    """
    Universeller Textblock. `zeilen` ist eine Liste von Absätzen;
    jeder Absatz ist eine Liste von Runs: (text, schrift, groesse_pt,
    farbe, fett, sperrung_pt100) — hintere Werte optional.
    Absatz-Optionen als Dict am Ende: {"align":..., "abstand_vor":Pt, "zeilenabstand":float}
    """
    box = s.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anker
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, absatz in enumerate(zeilen):
        opts = absatz[-1] if absatz and isinstance(absatz[-1], dict) else {}
        runs = absatz[:-1] if opts else absatz
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = opts.get("align", PP_ALIGN.LEFT)
        if "abstand_vor" in opts:
            p.space_before = opts["abstand_vor"]
        if "zeilenabstand" in opts:
            p.line_spacing = opts["zeilenabstand"]
        for r in runs:
            text, schrift, groesse, farbe = r[0], r[1], r[2], r[3]
            fett = r[4] if len(r) > 4 else False
            sperr = r[5] if len(r) > 5 else 0
            run = p.add_run()
            run.text = text
            run.font.name = schrift
            run.font.size = Pt(groesse)
            run.font.color.rgb = farbe
            run.font.bold = fett
            if sperr:
                _sperrung(run, sperr)
    return box


def kicker(s, text, x=RAND, y=Inches(0.55), w=Inches(6), farbe=None, groesse=11):
    """Mono-Label in Versalien mit weiter Sperrung — wie die Website-Kicker."""
    return textblock(s, x, y, w, Inches(0.35),
                     [[(text.upper(), MONO, groesse, farbe or THEMA["akzent"], False, 260)]])


def headline(s, teile, x=RAND, y=Inches(1.0), w=BREITE - 2 * RAND,
             groesse=40, align=PP_ALIGN.LEFT):
    """
    Display-Headline in Versalien. `teile` = Liste (text, farbe) —
    genau ein Wortteil in STAHL setzen, der Rest SILBER. Punkt am Ende.
    """
    runs = [(t.upper(), DISPLAY, groesse, f, True) for t, f in teile]
    return textblock(s, x, y, w, Inches(1.6),
                     [runs + [{"align": align, "zeilenabstand": 1.02}]])


def fliesstext(s, text, x, y, w, h=Inches(1.2), groesse=13, farbe=None,
               blocksatz=True, zeilenabstand=1.25):
    absaetze = [[(t, TEXT, groesse, farbe or THEMA["fliess"]),
                 {"align": PP_ALIGN.JUSTIFY if blocksatz else PP_ALIGN.LEFT,
                  "zeilenabstand": zeilenabstand,
                  "abstand_vor": Pt(6 if i else 0)}]
                for i, t in enumerate(text if isinstance(text, list) else [text])]
    return textblock(s, x, y, w, h, absaetze)


def linie_h(s, x, y, w, farbe=None, staerke=1.0):
    ln = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x, y, x + w, y)
    _flach(ln)
    ln.line.color.rgb = farbe or THEMA["linie"]
    ln.line.width = Pt(staerke)
    return ln


def massketten_trenner(s, label, y, x=RAND, w=BREITE - 2 * RAND):
    """
    Maßketten-Trenner wie auf der Website: Linie mit Endstrichen,
    mittig das Mono-Label. Trägt die Sektionsgliederung.
    """
    label = label.upper()
    label_w = Inches(0.16 + 0.62 + 0.115 * len(label))
    seite = (w - label_w) / 2
    mitte_y = y + Inches(0.09)
    tick = Inches(0.055)
    for lx in (x, x + w):
        t = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, lx, mitte_y - tick, lx, mitte_y + tick)
        _flach(t)
        t.line.color.rgb = THEMA["linie"]
        t.line.width = Pt(1)
    linie_h(s, x, mitte_y, seite)
    linie_h(s, x + w - seite, mitte_y, seite)
    textblock(s, x + seite, y - Inches(0.02), label_w, Inches(0.3),
              [[(label, MONO, 10, THEMA["akzent"], False, 300),
                {"align": PP_ALIGN.CENTER}]])


def karte(s, x, y, w, h, betont=False, grund=None):
    """Karte: Fläche mit feiner Linie, dezent gerundet. betont = Stahl-Rand."""
    k = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    _flach(k)
    k.adjustments[0] = 0.035
    k.fill.solid()
    k.fill.fore_color.rgb = grund or THEMA["karte"]
    k.line.color.rgb = THEMA["akzent"] if betont else THEMA["linie"]
    k.line.width = Pt(1.1 if betont else 1)
    k.shadow.inherit = False
    return k


def pille(s, text, x, y, farbe=None, w=None):
    """Kleines Mono-Etikett mit Rahmen (z. B. SCHRITT 1)."""
    text = text.upper()
    w = w or Inches(0.55 + 0.13 * len(text))
    farbe = farbe or THEMA["akzent"]
    p = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, Inches(0.34))
    _flach(p)
    p.adjustments[0] = 0.5
    p.fill.background()
    p.line.color.rgb = farbe
    p.line.width = Pt(1)
    p.shadow.inherit = False
    tf = p.text_frame
    tf.margin_left = tf.margin_right = Inches(0.05)
    tf.margin_top = tf.margin_bottom = 0
    tf.word_wrap = False
    r = tf.paragraphs[0].add_run()
    r.text = text
    r.font.name = MONO
    r.font.size = Pt(9)
    r.font.color.rgb = farbe
    _sperrung(r, 200)
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    return p


def cta(s, text, x, y, w=None, link=None, hell=True):
    """Handlungs-Knopf im Website-Stil: Stahl-Fläche, Tinte-Text, Versalien."""
    text = text.upper()
    w = w or Inches(1.0 + 0.135 * len(text))
    b = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, Inches(0.52))
    _flach(b)
    b.adjustments[0] = 0.5
    b.fill.solid()
    b.fill.fore_color.rgb = THEMA["cta_flaeche"] if hell else THEMA["karte2"]
    b.line.fill.background()
    b.shadow.inherit = False
    tf = b.text_frame
    tf.margin_left = tf.margin_right = Inches(0.1)
    tf.word_wrap = False
    r = tf.paragraphs[0].add_run()
    r.text = text
    r.font.name = DISPLAY
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = THEMA["cta_text"] if hell else THEMA["text"]
    _sperrung(r, 150)
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    if link:
        b.click_action.hyperlink.address = link
    return b


def zahl(s, wert, label, x, y, w=Inches(3.2), wert_groesse=44):
    """Kennzahl: große Display-Zahl, darunter Mono-Label."""
    textblock(s, x, y, w, Inches(0.95),
              [[(wert, DISPLAY, wert_groesse, THEMA["text"], True)]])
    textblock(s, x, y + Inches(0.92), w, Inches(0.5),
              [[(label.upper(), MONO, 10, THEMA["gedimmt"], False, 200)]])


def bild(s, pfad, x, y, w, h=None, abdunkeln=0):
    """Bild einsetzen, optional mit Graphit-Schleier (0-100)."""
    p = s.shapes.add_picture(pfad, x, y, width=w, height=h)
    if abdunkeln:
        o = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, p.width, p.height)
        _flach(o)
        o.fill.solid()
        o.fill.fore_color.rgb = NACHT
        _transparenz(o, abdunkeln)
        o.line.fill.background()
        o.shadow.inherit = False
    return p


def _transparenz(shape, sichtbar_prozent):
    """Füll-Transparenz hart im XML setzen (python-pptx hat kein API dafür)."""
    alpha = int(sichtbar_prozent * 1000)
    fill = shape.fill.fore_color._xFill
    srgb = fill.find(qn("a:srgbClr"))
    for kind in ("a:alpha",):
        el = srgb.find(qn(kind))
        if el is not None:
            srgb.remove(el)
    el = srgb.makeelement(qn("a:alpha"), {"val": str(alpha)})
    srgb.append(el)


def portraet_rund(s, pfad, x, y, d=Inches(1.05)):
    """Rundes Porträt mit Stahl-Rand (wie die Kontakt-Karte der Website)."""
    p = s.shapes.add_picture(pfad, x, y, width=d, height=d)
    # Kreisform: prstGeom direkt hinter xfrm einsetzen
    sp = p._element.spPr
    for old in sp.findall(qn("a:prstGeom")):
        sp.remove(old)
    geom = sp.makeelement(qn("a:prstGeom"), {"prst": "ellipse"})
    geom.append(sp.makeelement(qn("a:avLst"), {}))
    xfrm = sp.find(qn("a:xfrm"))
    sp.insert(list(sp).index(xfrm) + 1 if xfrm is not None else 0, geom)
    p.line.color.rgb = THEMA["akzent"]
    p.line.width = Pt(1.5)
    return p


def fusszeile(s, mitte, seite=None, links="MAINFRANKEN DIGITAL"):
    """Mono-Fußzeile: links Marke, mittig Deck-Titel, rechts Folgenzahl."""
    y = HOEHE - Inches(0.42)
    textblock(s, RAND, y, Inches(4), Inches(0.3),
              [[(links, MONO, 8, THEMA["gedimmt"], False, 200)]])
    textblock(s, Inches(4.5), y, BREITE - Inches(9), Inches(0.3),
              [[(mitte.upper(), MONO, 8, THEMA["gedimmt"], False, 200),
                {"align": PP_ALIGN.CENTER}]])
    if seite:
        textblock(s, BREITE - RAND - Inches(1.5), y, Inches(1.5), Inches(0.3),
                  [[(str(seite), MONO, 8, THEMA["gedimmt"], False, 200),
                    {"align": PP_ALIGN.RIGHT}]])


# ═══ Beratungs-Bausteine ═════════════════════════════════════════════

def bullets(s, punkte, x, y, w, groesse=13, abstand=10, zeilenabstand=1.2):
    """
    Aufzählung mit Stahl-Quadrat als Marker. `punkte` = Liste von
    Strings oder (titel, text)-Tupeln (Titel fett vorangestellt).
    """
    absaetze = []
    for i, p in enumerate(punkte):
        opts = {"zeilenabstand": zeilenabstand, "abstand_vor": Pt(abstand if i else 0)}
        if isinstance(p, tuple):
            absaetze.append([("▪  ", TEXT, groesse, THEMA["akzent"]),
                             (p[0] + ": ", TEXT, groesse, THEMA["text"], True),
                             (p[1], TEXT, groesse, THEMA["fliess"]), opts])
        else:
            absaetze.append([("▪  ", TEXT, groesse, THEMA["akzent"]),
                             (p, TEXT, groesse, THEMA["fliess"]), opts])
    return textblock(s, x, y, w, Inches(0.5), absaetze)


def tabelle(s, kopf, zeilen, x, y, w, zeilenhoehe=Inches(0.46), groesse=12):
    """
    Linien-Tabelle im Positionen-Stil: Mono-Kopf, feine Linien,
    keine Zebra-Flächen. `kopf` = Liste Spaltentitel, `zeilen` =
    Liste von Zeilen (Liste von Strings). Erste Spalte linksbündig,
    letzte rechtsbündig, wenn sie wie Zahlen aussieht.
    """
    n = len(kopf)
    sp_w = [w / n] * n
    # Kopf
    cx = x
    for j, titel in enumerate(kopf):
        align = PP_ALIGN.RIGHT if j == n - 1 else PP_ALIGN.LEFT
        textblock(s, cx, y, sp_w[j], Inches(0.3),
                  [[(str(titel).upper(), MONO, 9, THEMA["gedimmt"], False, 180),
                    {"align": align}]])
        cx += sp_w[j]
    yy = y + Inches(0.34)
    for zeile in zeilen:
        linie_h(s, x, yy, w)
        cx = x
        for j, wert in enumerate(zeile):
            align = PP_ALIGN.RIGHT if j == n - 1 else PP_ALIGN.LEFT
            fett = j == 0
            textblock(s, cx, yy + Inches(0.1), sp_w[j], zeilenhoehe - Inches(0.1),
                      [[(str(wert), TEXT, groesse, THEMA["text"] if fett else THEMA["fliess"], fett),
                        {"align": align}]])
            cx += sp_w[j]
        yy += zeilenhoehe
    linie_h(s, x, yy, w)
    return yy


def zeitstrahl(s, phasen, y, x=RAND, w=BREITE - 2 * RAND):
    """
    Horizontaler Zeitstrahl: Linie, Stahl-Punkte, darüber Mono-Zeitmarke,
    darunter Titel + Kurztext. `phasen` = Liste (zeitmarke, titel, text).
    """
    n = len(phasen)
    schritt = w / n
    linie_h(s, x, y, w, staerke=1.4)
    for i, (marke, titel, text) in enumerate(phasen):
        px = x + schritt * i + Inches(0.06)
        punkt = s.shapes.add_shape(MSO_SHAPE.OVAL, x + schritt * i, y - Inches(0.07),
                                   Inches(0.14), Inches(0.14))
        _flach(punkt)
        punkt.fill.solid()
        punkt.fill.fore_color.rgb = THEMA["akzent"]
        punkt.line.fill.background()
        punkt.shadow.inherit = False
        textblock(s, px, y - Inches(0.45), schritt - Inches(0.2), Inches(0.3),
                  [[(marke.upper(), MONO, 9, THEMA["akzent"], False, 180)]])
        textblock(s, px, y + Inches(0.22), schritt - Inches(0.25), Inches(0.5),
                  [[(titel, DISPLAY, 13, THEMA["text"], True)]])
        fliesstext(s, text, px, y + Inches(0.62), schritt - Inches(0.3),
                   Inches(1.2), groesse=10.5, blocksatz=False)


def matrix2x2(s, quadranten, x, y, w, h, achse_x=("", ""), achse_y=("", "")):
    """
    2x2-Matrix. `quadranten` = [(titel, text) x 4] in Lesereihenfolge
    (oben links, oben rechts, unten links, unten rechts).
    `achse_x` = (links, rechts), `achse_y` = (unten, oben).
    """
    gap = Inches(0.16)
    qw, qh = (w - gap) / 2, (h - gap) / 2
    pos = [(x, y), (x + qw + gap, y), (x, y + qh + gap), (x + qw + gap, y + qh + gap)]
    for (titel, text), (qx, qy) in zip(quadranten, pos):
        karte(s, qx, qy, qw, qh)
        textblock(s, qx + Inches(0.3), qy + Inches(0.25), qw - Inches(0.6), Inches(0.4),
                  [[(titel, DISPLAY, 13, THEMA["text"], True)]])
        fliesstext(s, text, qx + Inches(0.3), qy + Inches(0.68), qw - Inches(0.6),
                   qh - Inches(0.9), groesse=10.5, blocksatz=False)
    if achse_y[1]:
        textblock(s, x - Inches(0.42), y + Inches(0.05), Inches(0.35), h - Inches(0.1),
                  [[(achse_y[1].upper(), MONO, 8, THEMA["gedimmt"], False, 150)]])
    if achse_x[1]:
        textblock(s, x, y + h + Inches(0.12), w, Inches(0.3),
                  [[(f"{achse_x[0].upper()}", MONO, 8, THEMA["gedimmt"], False, 150)],
                   ])
        textblock(s, x, y + h + Inches(0.12), w, Inches(0.3),
                  [[(f"{achse_x[1].upper()}", MONO, 8, THEMA["gedimmt"], False, 150),
                    {"align": PP_ALIGN.RIGHT}]])


def zitat(s, text, quelle, y=Inches(2.6), x=RAND + Inches(0.8),
          w=BREITE - 2 * RAND - Inches(1.6)):
    """Großes Zitat / Kernbotschaft, zentriert, mit Stahl-Anführung."""
    textblock(s, x, y - Inches(0.85), w, Inches(0.9),
              [[("„", DISPLAY, 60, THEMA["akzent"], True), {"align": PP_ALIGN.CENTER}]])
    textblock(s, x, y, w, Inches(2),
              [[(text, DISPLAY, 24, THEMA["text"], True),
                {"align": PP_ALIGN.CENTER, "zeilenabstand": 1.15}]])
    textblock(s, x, y + Inches(2.1), w, Inches(0.4),
              [[(quelle.upper(), MONO, 10, THEMA["gedimmt"], False, 200),
                {"align": PP_ALIGN.CENTER}]])


def balkendiagramm(s, kategorien, reihen, x, y, w, h):
    """
    Natives, in PowerPoint editierbares Säulendiagramm im CI.
    `reihen` = Liste (name, werte). Erste Reihe Stahl, zweite gedimmt.
    """
    from pptx.chart.data import CategoryChartData
    from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION

    daten = CategoryChartData()
    daten.categories = kategorien
    for name, werte in reihen:
        daten.add_series(name, werte)
    gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, x, y, w, h, daten)
    ch = gf.chart
    ch.has_title = False
    farben = [THEMA["akzent"], THEMA["gedimmt"], THEMA["linie"]]
    for i, serie in enumerate(ch.series):
        serie.format.fill.solid()
        serie.format.fill.fore_color.rgb = farben[i % len(farben)]
        serie.format.line.fill.background()
    ch.has_legend = len(reihen) > 1
    if ch.has_legend:
        ch.legend.position = XL_LEGEND_POSITION.BOTTOM
        ch.legend.include_in_layout = False
        ch.legend.font.size = Pt(10)
        ch.legend.font.name = TEXT
        ch.legend.font.color.rgb = THEMA["fliess"]
    for achse in (ch.category_axis, ch.value_axis):
        achse.tick_labels.font.size = Pt(10)
        achse.tick_labels.font.name = TEXT
        achse.tick_labels.font.color.rgb = THEMA["fliess"]
        achse.format.line.color.rgb = THEMA["linie"]
    ch.value_axis.has_major_gridlines = True
    ch.value_axis.major_gridlines.format.line.color.rgb = THEMA["linie"]
    ch.category_axis.has_major_gridlines = False
    return gf
