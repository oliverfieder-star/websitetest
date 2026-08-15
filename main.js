/* ==========================================================================
   Mainfranken Digital — main.js
   Vanilla JS, keine Abhängigkeiten. Alles läuft ohne JS ebenfalls,
   nur ohne Bildübergang, ohne Count-up und ohne Einblenden.
   ========================================================================== */
(function () {
  'use strict';

  var ruheAbfrage = window.matchMedia('(prefers-reduced-motion: reduce)');
  var euroFormat = new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  });

  function klemme(wert, unten, oben) {
    return wert < unten ? unten : (wert > oben ? oben : wert);
  }

  /* Scroll-Ereignisse auf einen Frame pro Bild zusammenfassen. */
  function proFrame(arbeit) {
    var offen = false;
    return function () {
      if (offen) return;
      offen = true;
      window.requestAnimationFrame(function () {
        offen = false;
        arbeit();
      });
    };
  }

  /* ---------- Fortschrittsbalken im Kopf ---------------------------------- */

  function initFortschritt() {
    var balken = document.querySelector('[data-fortschritt]');
    if (!balken) return;

    var zeichne = proFrame(function () {
      var weg = document.documentElement.scrollHeight - window.innerHeight;
      var anteil = weg > 0 ? klemme(window.scrollY / weg, 0, 1) : 0;
      balken.style.width = (anteil * 100).toFixed(2) + '%';
    });

    window.addEventListener('scroll', zeichne, { passive: true });
    window.addEventListener('resize', zeichne);
    zeichne();
  }

  /* ---------- Einblenden beim Hereinscrollen ------------------------------ */

  function initEinblenden() {
    var teile = document.querySelectorAll('[data-zeigen]');
    if (!teile.length) return;

    if (!('IntersectionObserver' in window) || ruheAbfrage.matches) {
      Array.prototype.forEach.call(teile, function (teil) { teil.classList.add('zeigen'); });
      return;
    }

    var waechter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (eintrag) {
        if (!eintrag.isIntersecting) return;
        eintrag.target.classList.add('zeigen');
        waechter.unobserve(eintrag.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(teile, function (teil) { waechter.observe(teil); });
  }

  /* ---------- Bildübergang ------------------------------------------------ */

  function initWandel() {
    var bereich = document.querySelector('[data-wandel]');
    if (!bereich) return;

    var spur = bereich.querySelector('[data-spur]');
    var flaeche1 = bereich.querySelector('[data-flaeche="1"]');
    var flaeche2 = bereich.querySelector('[data-flaeche="2"]');
    var bild1 = flaeche1 && flaeche1.querySelector('img');
    var bild2 = flaeche2 && flaeche2.querySelector('img');
    var schild1 = bereich.querySelector('[data-schild="1"]');
    var schild2 = bereich.querySelector('[data-schild="2"]');
    if (!spur || !flaeche1 || !flaeche2 || !bild1 || !bild2) return;

    var kinoAbfrage = window.matchMedia('(min-width: 62rem) and (min-height: 34rem)');
    var laeuft = false;

    /* Anteil eines Abschnitts: 0 vor `von`, 1 ab `bis`, linear dazwischen. */
    function stufe(p, von, bis) {
      return klemme((p - von) / (bis - von), 0, 1);
    }

    var zeichne = proFrame(function () {
      if (!laeuft) return;

      var kasten = spur.getBoundingClientRect();
      var weg = spur.offsetHeight - window.innerHeight;
      var p = weg > 0 ? klemme(-kasten.top / weg, 0, 1) : 0;

      /* 30–70 %: Crossfade, linear mit dem Scroll, nicht auf Zeit. */
      var t = stufe(p, 0.30, 0.70);
      flaeche1.style.opacity = String(1 - t);
      flaeche2.style.opacity = String(t);

      /* Sehr dezenter Scale auf beiden Ebenen. */
      var mass = 'scale(' + (1 + 0.02 * t).toFixed(4) + ')';
      bild1.style.transform = mass;
      bild2.style.transform = mass;

      /* Beschriftung 1 steht in der ersten Phase, Beschriftung 2 ab 70 %. */
      if (schild1) schild1.style.opacity = String(1 - stufe(p, 0.28, 0.38));
      if (schild2) schild2.style.opacity = String(stufe(p, 0.62, 0.70));
    });

    function starte() {
      if (laeuft) return;
      laeuft = true;
      bereich.dataset.modus = 'kino';
      window.addEventListener('scroll', zeichne, { passive: true });
      window.addEventListener('resize', zeichne);
      zeichne();
    }

    function halte(modus) {
      if (laeuft) {
        laeuft = false;
        window.removeEventListener('scroll', zeichne);
        window.removeEventListener('resize', zeichne);
      }
      [flaeche1, flaeche2, schild1, schild2].forEach(function (teil) {
        if (teil) teil.style.opacity = '';
      });
      bild1.style.transform = '';
      bild2.style.transform = '';
      bereich.dataset.modus = modus;
    }

    function pruefe() {
      if (ruheAbfrage.matches) { halte('ruhig'); return; }
      if (kinoAbfrage.matches) { starte(); return; }
      halte('gestapelt');
    }

    lausche(kinoAbfrage, pruefe);
    lausche(ruheAbfrage, pruefe);
    pruefe();
  }

  /* Safari vor 14 kennt addEventListener auf MediaQueryList noch nicht. */
  function lausche(abfrage, arbeit) {
    if (abfrage.addEventListener) abfrage.addEventListener('change', arbeit);
    else if (abfrage.addListener) abfrage.addListener(arbeit);
  }

  /* ---------- Rückfall auf JPG -------------------------------------------- */
  /* Fehlt die .webp-Fassung, zeigt der Browser ein kaputtes Bild — ein
     <source> fällt von sich aus nicht auf das <img> zurück. Also nehmen wir
     die <source>-Zeile heraus, sobald das Laden schiefgeht. */

  function initBildRueckfall() {
    var bilder = document.querySelectorAll('picture > img');

    function rette(bild) {
      var eltern = bild.parentNode;
      if (!eltern || eltern.tagName !== 'PICTURE') return;

      var quellen = eltern.querySelectorAll('source');
      if (!quellen.length) return;   /* das JPG selbst fehlt — nichts zu retten */

      Array.prototype.forEach.call(quellen, function (quelle) {
        eltern.removeChild(quelle);
      });
      bild.src = bild.getAttribute('src');
    }

    Array.prototype.forEach.call(bilder, function (bild) {
      bild.addEventListener('error', function () { rette(bild); });
      /* Das erste Bild kann schon gescheitert sein, bevor wir hier ankommen. */
      if (bild.complete && bild.naturalWidth === 0) rette(bild);
    });
  }

  /* ---------- Förderrechner ----------------------------------------------- */

  var UNTERGRENZE = 4000;   // unter diesem Volumen fördert das Programm nicht
  var SATZ = 0.5;           // 50 Prozent Zuschuss
  var DECKEL = 7500;        // Digitalbonus Standard, gedeckelt

  function initRechner() {
    var rechner = document.querySelector('[data-rechner]');
    if (!rechner) return;

    var regler = rechner.querySelector('[data-regler]');
    var feld = rechner.querySelector('[data-feld]');
    var fuellung = rechner.querySelector('[data-fuellung]');
    var meldung = rechner.querySelector('[data-meldung]');
    var ausgaben = {
      volumen: rechner.querySelector('[data-aus="volumen"]'),
      zuschuss: rechner.querySelector('[data-aus="zuschuss"]'),
      anteil: rechner.querySelector('[data-aus="anteil"]')
    };
    if (!regler || !feld) return;

    var minimum = Number(regler.min) || 4000;
    var maximum = Number(regler.max) || 60000;
    var stand = { volumen: 0, zuschuss: 0, anteil: 0 };
    var laeufe = {};

    function rechne(volumen) {
      /* Der Deckel ist nicht optional: mehr als 7.500 € gibt es im
         Digitalbonus Standard nicht, egal wie groß das Projekt ist.
         Unterhalb der Programmgrenze gibt es gar nichts. */
      var zuschuss = volumen >= UNTERGRENZE ? Math.min(volumen * SATZ, DECKEL) : 0;
      return { volumen: volumen, zuschuss: zuschuss, anteil: volumen - zuschuss };
    }

    function text(volumen) {
      if (volumen < UNTERGRENZE) {
        return 'Unter 4.000 Euro Projektvolumen ist keine Förderung möglich. Das ist die Mindestgrenze des Programms.';
      }
      if (volumen <= 15000) {
        return 'Sie erhalten 50 Prozent Zuschuss.';
      }
      return 'Der Digitalbonus Standard ist bei 7.500 Euro gedeckelt — über 15.000 Euro Projektvolumen kommt kein weiterer Zuschuss hinzu. Für größere Vorhaben gibt es den Digitalbonus Plus mit bis zu 30.000 Euro. Der setzt einen nachweisbaren Innovationsgehalt und eine Vorabberatung voraus. Sprechen Sie mich an.';
    }

    /* Count-up: zählt vom aktuellen Wert zum neuen, ~450 ms, weich auslaufend. */
    function zaehle(schluessel, ziel) {
      var feldElement = ausgaben[schluessel];
      if (!feldElement) return;

      if (laeufe[schluessel]) window.cancelAnimationFrame(laeufe[schluessel]);

      var von = stand[schluessel];
      stand[schluessel] = ziel;

      if (ruheAbfrage.matches || von === ziel) {
        feldElement.textContent = euroFormat.format(ziel);
        return;
      }

      var dauer = 450;
      var start = null;

      function schritt(zeit) {
        if (start === null) start = zeit;
        var anteil = klemme((zeit - start) / dauer, 0, 1);
        var weich = 1 - Math.pow(1 - anteil, 3);
        feldElement.textContent = euroFormat.format(Math.round(von + (ziel - von) * weich));
        if (anteil < 1) laeufe[schluessel] = window.requestAnimationFrame(schritt);
      }

      laeufe[schluessel] = window.requestAnimationFrame(schritt);
    }

    function zeige(volumen) {
      var ergebnis = rechne(volumen);

      zaehle('volumen', ergebnis.volumen);
      zaehle('zuschuss', ergebnis.zuschuss);
      zaehle('anteil', ergebnis.anteil);

      if (meldung) meldung.textContent = text(volumen);

      if (fuellung) {
        var lage = klemme((volumen - minimum) / (maximum - minimum), 0, 1);
        fuellung.style.width = (lage * 100).toFixed(2) + '%';
      }
    }

    function ausFeld() {
      var roh = parseInt(String(feld.value).replace(/[^\d]/g, ''), 10);
      if (isNaN(roh)) return;
      var volumen = klemme(roh, 0, maximum);
      regler.value = String(klemme(volumen, minimum, maximum));
      zeige(volumen);
    }

    function ausRegler() {
      var volumen = Number(regler.value);
      feld.value = String(volumen);
      zeige(volumen);
    }

    regler.addEventListener('input', ausRegler);
    feld.addEventListener('input', ausFeld);
    feld.addEventListener('blur', function () {
      if (String(feld.value).trim() === '') {
        feld.value = String(regler.value);
        zeige(Number(regler.value));
      }
    });

    /* Startwert einmal ohne Count-up setzen. */
    var startwert = Number(regler.value);
    var erstes = rechne(startwert);
    stand = { volumen: erstes.volumen, zuschuss: erstes.zuschuss, anteil: erstes.anteil };
    Object.keys(ausgaben).forEach(function (schluessel) {
      if (ausgaben[schluessel]) ausgaben[schluessel].textContent = euroFormat.format(erstes[schluessel]);
    });
    if (meldung) meldung.textContent = text(startwert);
    if (fuellung) {
      fuellung.style.width = (klemme((startwert - minimum) / (maximum - minimum), 0, 1) * 100).toFixed(2) + '%';
    }
  }

  /* ---------- Kontaktformular --------------------------------------------- */
  /* Ohne Server im Rücken: der Knopf packt die Angaben in eine E-Mail.
     Sobald ein Formular-Endpunkt da ist, hier `action` setzen und
     diesen Block entfernen. */

  function initFormular() {
    var formular = document.querySelector('[data-formular]');
    if (!formular) return;

    formular.addEventListener('submit', function (ereignis) {
      ereignis.preventDefault();

      if (!formular.checkValidity()) {
        formular.reportValidity();
        return;
      }

      var daten = new FormData(formular);
      var zeilen = [
        'Betrieb: ' + (daten.get('betrieb') || ''),
        'Name: ' + (daten.get('name') || ''),
        'Telefon: ' + (daten.get('telefon') || ''),
        'E-Mail: ' + (daten.get('email') || ''),
        '',
        String(daten.get('nachricht') || '')
      ];

      window.location.href = 'mailto:oliver@mainfrankendigital.de'
        + '?subject=' + encodeURIComponent('Anfrage über die Website — ' + (daten.get('betrieb') || ''))
        + '&body=' + encodeURIComponent(zeilen.join('\n'));
    });
  }

  /* ---------- Start -------------------------------------------------------- */

  function start() {
    initBildRueckfall();
    initFortschritt();
    initEinblenden();
    initWandel();
    initRechner();
    initFormular();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
