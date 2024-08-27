export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
    subLinks?: Link[];
    image?: Image;
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
        src: '/dante-preview.jpg',
        alt: 'Dante - Astro.js and Tailwind CSS theme'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Hypnosetherapie',
            href: '/hypnosetherapie',
            subLinks: [
                { 
                    text: 'Süchte und Rauchen', 
                    href: '/hypnosetherapie/suechte-rauchen', 
                    image: { 
                        src: '/uploads/cigarette.avif', 
                        alt: 'Süchte und Rauchen',
                     } 
                },
                {   
                    text: 'Ernährung', 
                    href: '/hypnosetherapie/ernaehrung', 
                    image: { 
                        src: '/uploads/food.avif', 
                        alt: 'Ernährung',
                     } 
                },
                {   
                    text: 'Ängste und Phobien', 
                    href: '/hypnosetherapie/aengste-und-phobien', 
                    image: { 
                        src: '/uploads/fears.avif', 
                        alt: 'Ängste und Phobien',
                     }
                },
                { 
                    text: 'Stress, Burnout und Depression', 
                    href: '/hypnosetherapie/stress-burnout-und-depression', 
                    image: { 
                        src: '/uploads/depression.avif', 
                        alt: 'Stress, Burnout und Depression',
                     }
                },
                { 
                    text: 'Selbstvertrauen', 
                    href: '/hypnosetherapie/selbstvertrauen', 
                    image: { 
                        src: '/uploads/glowing-blocks.avif', 
                        alt: 'Selbstvertrauen',
                     }
                },
                { 
                    text: 'Schlafstörungen', 
                    href: '/hypnosetherapie/schlafstoerungen',
                    image: { 
                        src: '/uploads/sleep.avif', 
                        alt: 'Schlafstörungen',
                     } }
                
            ]
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
