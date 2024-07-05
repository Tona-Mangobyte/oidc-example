class InMemoryAdapter {
    constructor() {
        this.store = {};
    }

    async upsert(id, payload, expiresIn) {
        this.store[id] = {
            payload,
            expiresIn: expiresIn ? Date.now() + expiresIn * 1000 : null,
        };
    }

    async find(id) {
        const item = this.store[id];
        if (!item) return undefined;
        if (item.expiresIn && Date.now() > item.expiresIn) {
            delete this.store[id];
            return undefined;
        }
        return item.payload;
    }

    async destroy(id) {
        delete this.store[id];
    }

    // Implement other required methods following the oidc-provider documentation
}

export default InMemoryAdapter;
