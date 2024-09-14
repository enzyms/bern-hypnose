export function slugify(input?: string) {
    if (!input) return '';

    // Make lower case and trim
    let slug = input.toLowerCase().trim();

    // Replace German umlauts and ß with their equivalents
    slug = slug
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss');

    // Remove accents from characters
    slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Replace invalid chars with spaces
    slug = slug.replace(/[^a-z0-9\s-]/g, '').trim();

    // Replace multiple spaces or hyphens with a single hyphen
    slug = slug.replace(/[\s-]+/g, '-');

    return slug;
}

