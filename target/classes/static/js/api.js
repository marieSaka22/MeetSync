// api.js — centralised fetch wrapper
// All calls go through here so token handling is in one place

const api = {

    _token() {
        return localStorage.getItem('token');
    },

    _headers() {
        return {
            'Content-Type': 'application/json',
            ...(this._token() ? { 'Authorization': `Bearer ${this._token()}` } : {})
        };
    },

    async _handle(response) {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            // If 401 → redirect to login
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = '/pages/login.html';
            }
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        return data;
    },

    async get(url) {
        const res = await fetch(url, { headers: this._headers() });
        return this._handle(res);
    },

    async post(url, body) {
        const res = await fetch(url, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(body)
        });
        return this._handle(res);
    },

    async put(url, body) {
        const res = await fetch(url, {
            method: 'PUT',
            headers: this._headers(),
            body: JSON.stringify(body)
        });
        return this._handle(res);
    },

    async delete(url) {
        const res = await fetch(url, {
            method: 'DELETE',
            headers: this._headers()
        });
        return this._handle(res);
    }
};
