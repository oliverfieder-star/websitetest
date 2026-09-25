/* Google Kalender: Anmeldung (Google Identity Services, Token-Modell)
   und die paar REST-Aufrufe, die der Planer braucht. Kein Server nötig:
   Das Zugriffstoken gilt eine Stunde und wird danach per Klick erneuert. */

(function () {
  const API = 'https://www.googleapis.com/calendar/v3';
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' ');
  const TOKEN_KEY = 'planer.gtoken';

  const GCal = {
    clientId: '',
    scriptReady: false,
    tokenClient: null,
    token: null,
    expires: 0,
    hint: '',
    calendars: [],          // [{id, summary, backgroundColor, accessRole, primary}]
    events: new Map(),      // calendarId -> [google event]
    window: null,           // {min: Date, max: Date} des geladenen Zeitraums
    loading: false,
    error: '',
    onChange: () => {},

    // Status für die Oberfläche: 'unconfigured' | 'unavailable' | 'disconnected' | 'expired' | 'connected'
    get status() {
      if (!this.clientId) return 'unconfigured';
      if (this.token && Date.now() < this.expires) return 'connected';
      if (this.hint) return 'expired';
      if (!this.scriptReady) return 'unavailable';
      return 'disconnected';
    },

    init(clientId, onChange) {
      this.clientId = (clientId || '').trim();
      this.onChange = onChange || this.onChange;
      try {
        const saved = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
        if (saved) {
          this.hint = saved.hint || '';
          if (saved.clientId === this.clientId && saved.expires > Date.now() + 60_000) {
            this.token = saved.token;
            this.expires = saved.expires;
          }
        }
      } catch { /* Speicher gesperrt: dann eben ohne */ }
      this.setupClient();
    },

    setClientId(id) {
      id = (id || '').trim();
      if (id === this.clientId) return;
      this.clientId = id;
      this.token = null;
      this.expires = 0;
      this.tokenClient = null;
      this.setupClient();
      this.onChange();
    },

    scriptLoaded() {
      this.scriptReady = true;
      this.setupClient();
      this.onChange();
    },

    setupClient() {
      if (!this.scriptReady || !this.clientId || this.tokenClient) return;
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: SCOPES,
          callback: (resp) => this.handleToken(resp),
          error_callback: (err) => {
            this.error = err && err.type === 'popup_closed' ? 'Anmeldung abgebrochen.' : 'Anmeldung fehlgeschlagen.';
            this.onChange();
          },
        });
      } catch (e) {
        this.error = 'Google-Anmeldung konnte nicht starten: ' + e.message;
      }
    },

    connect() {
      if (!this.clientId) { this.error = 'Trage zuerst eine OAuth-Client-ID ein.'; this.onChange(); return; }
      if (!this.tokenClient) {
        this.error = 'Die Google-Anmeldung ist nicht erreichbar. Läuft der Planer über http(s) und nicht als Datei?';
        this.onChange();
        return;
      }
      this.error = '';
      this.tokenClient.requestAccessToken({ prompt: this.hint ? '' : 'consent', hint: this.hint || undefined });
    },

    handleToken(resp) {
      if (resp.error) { this.error = 'Google hat den Zugriff abgelehnt (' + resp.error + ').'; this.onChange(); return; }
      this.token = resp.access_token;
      this.expires = Date.now() + (Number(resp.expires_in) || 3600) * 1000;
      this.error = '';
      this.persist();
      this.refresh(true);
    },

    persist() {
      try {
        localStorage.setItem(TOKEN_KEY, JSON.stringify({
          token: this.token, expires: this.expires, hint: this.hint, clientId: this.clientId,
        }));
      } catch { /* egal */ }
    },

    disconnect() {
      if (this.token && this.scriptReady) {
        try { google.accounts.oauth2.revoke(this.token, () => {}); } catch { /* egal */ }
      }
      this.token = null;
      this.expires = 0;
      this.hint = '';
      this.calendars = [];
      this.events = new Map();
      this.window = null;
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* egal */ }
      this.onChange();
    },

    async api(path, options = {}) {
      if (this.status !== 'connected') throw new Error('Nicht mit Google verbunden.');
      const res = await fetch(API + path, {
        ...options,
        headers: {
          Authorization: 'Bearer ' + this.token,
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
      if (res.status === 401) {
        this.token = null;
        this.expires = 0;
        this.persist();
        this.onChange();
        throw new Error('Die Google-Sitzung ist abgelaufen. Bitte neu verbinden.');
      }
      if (res.status === 204) return null;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error && data.error.message) || ('Google antwortet mit Fehler ' + res.status));
      return data;
    },

    async loadCalendars() {
      const list = [];
      let pageToken = '';
      do {
        const data = await this.api('/users/me/calendarList?maxResults=250' + (pageToken ? '&pageToken=' + pageToken : ''));
        list.push(...(data.items || []));
        pageToken = data.nextPageToken || '';
      } while (pageToken);
      this.calendars = list
        .filter((c) => !c.deleted)
        .map((c) => ({
          id: c.id,
          summary: c.summaryOverride || c.summary || c.id,
          backgroundColor: c.backgroundColor || '#8a94a6',
          accessRole: c.accessRole,
          primary: !!c.primary,
          selected: c.selected !== false,
        }))
        .sort((a, b) => (b.primary - a.primary) || a.summary.localeCompare(b.summary, 'de'));
      const primary = this.calendars.find((c) => c.primary);
      if (primary) { this.hint = primary.id; this.persist(); }
    },

    async loadEvents(calendarId, min, max) {
      const items = [];
      let pageToken = '';
      do {
        const q = new URLSearchParams({
          timeMin: min.toISOString(),
          timeMax: max.toISOString(),
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '2500',
        });
        if (pageToken) q.set('pageToken', pageToken);
        const data = await this.api('/calendars/' + encodeURIComponent(calendarId) + '/events?' + q);
        items.push(...(data.items || []).filter((e) => e.status !== 'cancelled'));
        pageToken = data.nextPageToken || '';
      } while (pageToken);
      return items;
    },

    // Lädt Kalenderliste und alle Termine im Fenster [min, max).
    // Ohne Fenster wird das zuletzt geladene erneut abgefragt.
    async refresh(withCalendars = false, min, max) {
      if (this.status !== 'connected') return;
      if (min && max) this.window = { min, max };
      if (!this.window) return this.onChange('need-window');
      this.loading = true;
      this.onChange();
      try {
        if (withCalendars || !this.calendars.length) await this.loadCalendars();
        const { min: wMin, max: wMax } = this.window;
        const results = await Promise.all(this.calendars.map((c) =>
          this.loadEvents(c.id, wMin, wMax).then((items) => [c.id, items]).catch(() => [c.id, this.events.get(c.id) || []])
        ));
        this.events = new Map(results);
        this.error = '';
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
        this.onChange();
      }
    },

    covers(min, max) {
      return this.window && this.window.min <= min && this.window.max >= max;
    },

    calendar(id) { return this.calendars.find((c) => c.id === id); },
    writable(id) { const c = this.calendar(id); return !!c && (c.accessRole === 'owner' || c.accessRole === 'writer'); },

    replaceLocal(calendarId, event) {
      const list = (this.events.get(calendarId) || []).filter((e) => e.id !== event.id);
      list.push(event);
      this.events.set(calendarId, list);
    },
    removeLocal(calendarId, eventId) {
      this.events.set(calendarId, (this.events.get(calendarId) || []).filter((e) => e.id !== eventId));
    },

    async patchEvent(calendarId, eventId, body) {
      const updated = await this.api('/calendars/' + encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId), {
        method: 'PATCH', body: JSON.stringify(body),
      });
      this.replaceLocal(calendarId, updated);
      return updated;
    },

    async insertEvent(calendarId, body) {
      const created = await this.api('/calendars/' + encodeURIComponent(calendarId) + '/events', {
        method: 'POST', body: JSON.stringify(body),
      });
      this.replaceLocal(calendarId, created);
      return created;
    },

    async deleteEvent(calendarId, eventId) {
      await this.api('/calendars/' + encodeURIComponent(calendarId) + '/events/' + encodeURIComponent(eventId), { method: 'DELETE' });
      this.removeLocal(calendarId, eventId);
    },
  };

  window.GCal = GCal;
})();
