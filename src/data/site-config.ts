export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
};

const siteConfig: SiteConfig = {
    title: 'Hypnosetherapie in Bern',
    subtitle: 'Janine Aerni',
    description: 'Hypnosetherapie in Bern',
    image: {
        src: '/hypnose1.png',
        alt: 'Janine Aerni – Hypnosetherapie in Bern'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Hypnosetherapie',
            href: '/hypnosetherapie'
        },
        {
            text: 'Angebote',
            href: '/angebote'
        },
        {
            text: 'Blog',
            href: '/blog'
        },
        {
            text: 'Über mich',
            href: '/janine-aerni'
        },
        {
            text: 'Kontakt & Termin',
            href: '/kontakt'
        },
    ],
    footerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Hypnosetherapie',
            href: '/hypnosetherapie'
        },
        {
            text: 'Angebote',
            href: '/angebote'
        },
        {
            text: 'Blog',
            href: '/blog'
        },
        {
            text: 'Über mich',
            href: '/janine-aerni'
        },
        {
            text: 'Kontakt & Termin',
            href: '/kontakt'
        },
    ],
    socialLinks: [
        {
            text: 'LinkedIn',
            href: 'https://www.linkedin.com/'
        }
    ],
    hero: {
        title: 'Hypnosetherapie in Bern',
        text: "Ich bin Janine Aerni, Hypnosetherapeutin in Ausbildung in Bern. Mit einer warmen und unterstützenden Herangehensweise helfe ich dir, Stress, Angst, Phobien und mehr zu überwinden. Entdecke die transformative Kraft der Hypnosetherapie in einer sicheren Umgebung.",
        actions: [
            {
                text: 'Angebote',
                href: '/angebote'
            },
            {
                text: 'Kontakt & Termin buchen',
                href: '/kontakt'
            },
            
        ]
    },
    subscribe: {
        title: 'Subscribe to Dante Newsletter',
        text: 'One update per week. All the latest posts directly in your inbox.',
        formUrl: '#'
    },
    postsPerPage: 8
};

export default siteConfig;
