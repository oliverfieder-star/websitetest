#!/usr/bin/env python3
"""Repliziert die JS-Licht-Rampe und prüft WCAG-Kontrast über alle Scrollzustände."""

BG_STOPS = [
    (0.00, "#101B2E"),  # Nacht
    (0.18, "#14203A"),  # tiefe Nacht, leicht aufgehellt
    (0.34, "#3A4A6B"),  # Daemmerung
    (0.50, "#705A6A"),  # Fruehlicht (mauve)
    (0.64, "#C9885A"),  # Morgen
    (0.82, "#F2EFE8"),  # Tag
    (1.00, "#F6F0E4"),  # Tag, warm
]

THRESH = 0.175  # Luminanz-Schwelle Hell-/Dunkeltext

def hx(h):
    h = h.lstrip("#")
    return [int(h[i:i+2], 16) for i in (0, 2, 4)]

def lerp(a, b, t):
    return [round(a[i] + (b[i] - a[i]) * t) for i in range(3)]

def bg_at(t):
    for i in range(len(BG_STOPS) - 1):
        t0, c0 = BG_STOPS[i]
        t1, c1 = BG_STOPS[i + 1]
        if t0 <= t <= t1:
            f = (t - t0) / (t1 - t0)
            return lerp(hx(c0), hx(c1), f)
    return hx(BG_STOPS[-1][1])

def lum(rgb):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(a, b):
    la, lb = lum(a), lum(b)
    lo, hi = min(la, lb), max(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def text_at(L):
    if L < THRESH:
        f = clamp((L - 0.05) / 0.125)          # -> reines Weiss zur Schwelle hin
        return lerp(hx("#EDE9DF"), hx("#FFFFFF"), f)
    f = clamp((L - THRESH) / 0.165)            # von Schwarz zu Tinte
    return lerp(hx("#000000"), hx("#1C2733"), f)

def muted_at(L, text, bg):
    c = contrast(text, bg)
    m = 0.30 * clamp((c - 6.0) / 8.0)   # Abschwaechung nur bei grossem Kontrast-Spielraum
    return lerp(text, bg, m)

worst_text = (99, None)
worst_muted = (99, None)
for i in range(0, 1001):
    t = i / 1000
    bg = bg_at(t)
    L = lum(bg)
    txt = text_at(L)
    mut = muted_at(L, txt, bg)
    ct = contrast(txt, bg)
    cm = contrast(mut, bg)
    if ct < worst_text[0]:
        worst_text = (ct, (t, L, txt))
    if cm < worst_muted[0]:
        worst_muted = (cm, (t, L, mut))

print(f"schlechtester Text-Kontrast : {worst_text[0]:.2f} bei t={worst_text[1][0]:.3f} (L={worst_text[1][1]:.3f}) rgb={worst_text[1][2]}")
print(f"schlechtester Muted-Kontrast: {worst_muted[0]:.2f} bei t={worst_muted[1][0]:.3f} (L={worst_muted[1][1]:.3f}) rgb={worst_muted[1][2]}")

# Statische Abschnittsfarben (reduced motion / kein JS)
static_pairs = [
    ("Hero Nacht",      "#101B2E", "#EDE9DF"),
    ("Problem Nacht2",  "#16233C", "#EDE9DF"),
    ("Angebote Daemm.", "#3A4A6B", "#F4F1EA"),
    ("Foerder. Morgen", "#C9885A", "#141B22"),
    ("Ablauf Uebergang","#E3CDB0", "#1C2733"),
    ("FAQ/Kontakt Tag", "#F2EFE8", "#1C2733"),
]
print("\nStatische Abschnitte:")
for name, b, tcol in static_pairs:
    print(f"  {name:18s} {contrast(hx(tcol), hx(b)):.2f}")

# Akzente
print("\nAkzente:")
print(f"  Lichtwarm auf Nacht      : {contrast(hx('#E8A34D'), hx('#101B2E')):.2f}")
print(f"  Tinte auf Lichtwarm (CTA): {contrast(hx('#1C2733'), hx('#E8A34D')):.2f}")
print(f"  Dunkel-Amber auf Tag     : {contrast(hx('#8A571B'), hx('#F2EFE8')):.2f}")
