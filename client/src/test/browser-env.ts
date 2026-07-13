export class MemoryStorage implements Storage {
    private readonly values = new Map<string, string>();

    get length() {
        return this.values.size;
    }

    clear() {
        this.values.clear();
    }

    getItem(key: string) {
        return this.values.get(key) ?? null;
    }

    key(index: number) {
        return Array.from(this.values.keys())[index] ?? null;
    }

    removeItem(key: string) {
        this.values.delete(key);
    }

    setItem(key: string, value: string) {
        this.values.set(key, value);
    }
}

export function installBrowserEnvironment(pathname = '/') {
    const localStorage = new MemoryStorage();
    const location = { pathname, href: pathname };

    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { localStorage, location },
    });
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: localStorage,
    });

    return { localStorage, location };
}

export function removeBrowserEnvironment() {
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'localStorage');
}
