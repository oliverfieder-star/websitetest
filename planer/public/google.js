/* Google Kalender über den Planer-Server. Der Server hält die Google-Anmeldung,
   der Browser fragt nur /api/calendar ab. */

(function () {
  const GCal = {
    enabled: false,         // false im Demo-Modus ohne Server
    calendars: [],          // [{id, summary, backgroundColor, accessRole, primary, selected}]
    events: new Map(),      // calendarId -> [google event]
    window: null,           // {min: Date, max: Date} des geladenen Zeitraums
    timeZone: '',
    loading: false,
    error: '',
    onChange: () => {},

    get status() {
      if (!this.enabled) return 'unavailable';
      return this.error === 'login' ? 'expired' : 'connected';
    },

    async req(method, path, body) {
      const res = await fetch('/api' + path, {
        method,
        headers: { 'X-Planer': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { this.error = 'login'; throw new Error('Bitte neu anmelden.'); }
      if (!res.ok) throw new Error(data.error || 'Server antwortet mit Fehler ' + res.status);
      return data;
    },

    // Lädt Kalenderliste und alle Termine im Fenster [min, max).
    async refresh(fresh = false, min, max) {
      if (!this.enabled) return;
      if (min && max) this.window = { min, max };
      if (!this.window) return this.onChange('need-window');
      this.loading = true;
      this.onChange();
      try {
        const q = new URLSearchParams({ timeMin: this.window.min.toISOString(), timeMax: this.window.max.toISOString() });
        if (fresh) q.set('fresh', '1');
        const data = await this.req('GET', '/calendar?' + q);
        this.calendars = data.calendars || [];
        this.events = new Map(Object.entries(data.events || {}));
        this.timeZone = data.timeZone || '';
        this.error = '';
      } catch (e) {
        if (this.error !== 'login') this.error = e.message;
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

    async patchEvent(calendarId, eventId, patch) {
      const updated = await this.req('PATCH', '/calendar/events', { calendarId, eventId, patch });
      this.replaceLocal(calendarId, updated);
      return updated;
    },
    async insertEvent(calendarId, event) {
      const created = await this.req('POST', '/calendar/events', { calendarId, event });
      this.replaceLocal(calendarId, created);
      return created;
    },
    async deleteEvent(calendarId, eventId) {
      await this.req('DELETE', '/calendar/events?' + new URLSearchParams({ calendarId, eventId }));
      this.removeLocal(calendarId, eventId);
    },
  };

  window.GCal = GCal;
})();
