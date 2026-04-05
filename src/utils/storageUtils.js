function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    if (!value) return null;

    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn(`Failed to parse localStorage key: ${key}`, error);
        return null;
    }
}

function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
}

function setCacheWithExpiry(key, value, ttlMs = 5 * 60 * 1000) {
    const payload = {
        value,
        expiresAt: Date.now() + ttlMs,
    };
    saveToLocalStorage(key, payload);
}

function getCacheWithExpiry(key) {
    const payload = getFromLocalStorage(key);
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
        removeFromLocalStorage(key);
        return null;
    }
    return payload.value;
}

export {
    saveToLocalStorage,
    getFromLocalStorage,
    removeFromLocalStorage,
    setCacheWithExpiry,
    getCacheWithExpiry,
};