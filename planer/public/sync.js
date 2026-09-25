/* Abgleich der Planer-Daten mit dem Server (und damit mit Google Drive).
   Änderungen gehen gebündelt nach kurzer Pause raus. Hat inzwischen ein anderes
   Gerät oder Claude etwas geändert, werden beide Stände zusammengeführt. */

(function () {
  const { migrate, merge3 } = window.PlanerShared;
  const clone = (x) => JSON.parse(JSON.stringify(x));

  const Sync = {
    rev: 0,
    base: null,          // letzter Stand vom Server
    dirty: false,
    inflight: false,
    state: 'saved',      // 'saved' | 'pending' | 'saving' | 'offline' | 'error'
    get: null,           // () => aktueller Stand im Browser
    set: null,           // (doc) => Stand im Browser ersetzen
    onRemote: () => {},  // Stand wurde von außen geändert
    onState: () => {},
    onLogin: () => {},   // Sitzung abgelaufen
    timer: 0,

    async request(method, body, query = '') {
      const res = await fetch('/api/data' + query, {
        method,
        headers: { 'X-Planer': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        keepalive: method === 'PUT' && body && JSON.stringify(body).length < 60000,
      });
      if (res.status === 401) { this.onLogin(); throw Object.assign(new Error('login'), { login: true }); }
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    },

    async start({ get, set, onRemote, onState, onLogin }) {
      Object.assign(this, { get, set, onRemote, onState, onLogin });
      const { status, data } = await this.request('GET');
      if (status !== 200) throw new Error(data.error || 'Daten konnten nicht geladen werden.');
      this.rev = data.rev;
      this.base = migrate(data.doc);
      this.set(clone(this.base));
      setInterval(() => this.pull(), 30000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.pull();
        else this.flush();
      });
      window.addEventListener('online', () => this.flush());
      window.addEventListener('beforeunload', (e) => {
        if (this.dirty || this.inflight) { this.flush(); e.preventDefault(); }
      });
    },

    setState(s) { if (this.state !== s) { this.state = s; this.onState(s); } },

    changed(now) {
      this.dirty = true;
      this.setState('pending');
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), now ? 0 : 700);
    },

    async flush() {
      clearTimeout(this.timer);
      if (!this.dirty || this.inflight) return;
      this.inflight = true;
      this.dirty = false;
      this.setState('saving');
      const doc = clone(this.get());
      try {
        const { status, data } = await this.request('PUT', { baseRev: this.rev, doc });
        if (status === 200) {
          this.rev = data.rev;
          this.base = doc;
        } else if (status === 409) {
          // Jemand anderes war schneller: zusammenführen und erneut senden
          const remote = migrate(data.doc);
          this.set(merge3(this.base, this.get(), remote));
          this.base = remote;
          this.rev = data.rev;
          this.dirty = true;
          this.onRemote();
        } else {
          this.dirty = true;
          this.setState('error');
          this.retry(15000);
          return;
        }
      } catch (e) {
        this.dirty = true;
        if (!e.login) { this.setState('offline'); this.retry(5000); }
        return;
      } finally {
        this.inflight = false;
      }
      if (this.dirty) this.flush();
      else this.setState('saved');
    },

    retry(ms) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), ms);
    },

    // Neuen Stand vom Server holen, falls sich dort etwas geändert hat
    async pull() {
      if (this.inflight || document.visibilityState !== 'visible') return;
      try {
        const { status, data } = await this.request('GET', null, '?rev=' + this.rev);
        if (status !== 200 || data.unchanged || this.inflight) return;
        const remote = migrate(data.doc);
        this.set(this.dirty ? merge3(this.base, this.get(), remote) : clone(remote));
        this.base = remote;
        this.rev = data.rev;
        this.onRemote();
        if (this.state === 'offline') this.setState(this.dirty ? 'pending' : 'saved');
      } catch { /* nächster Versuch beim nächsten Intervall */ }
    },
  };

  window.PlanerSync = Sync;
})();
