export default function flattenQuery(query: any): Record<string, string | string[]> {
    const flattened: Record<string, string | string[]> = {};

    for (const key in query) {
        const val = query[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            for (const subKey in val) {
                flattened[`${key}[${subKey}]`] = val[subKey];
            }
        } else {
            flattened[key] = val;
        }
    }

    return flattened;
};