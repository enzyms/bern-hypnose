export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    longText?: string;
    href: string;
    subLinks?: Link[];
    image?: Image;
};

export type Hero = {
    title?: string;
    subtitle?: string;
    name?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type Testimonial = {
    id: number;
    quote: string;
    author: string;
    url?: string;
}

export type SiteConfig = {
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    imageHomepage?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
    testimonials?: Testimonial[];
};

const siteConfig: SiteConfig = {
    testimonials: [
    {
      "id": 1,
      "quote": "Ich war wegen Durchschlafproblemen bei Janine. Seit der Hypnosetherapie bei Janine schlafe ich viel besser. Ich habe mich während der Sitzung stehts geborgen und sicher gefühlt. Alles in allem eine sehr tolle Erfahrung, die ich nur weiterempfehlen kann.",
      "author": "Paula B.",
      "url": "https://maps.app.goo.gl/dVE5uGwXezAQ2TyV8"
    },
    // {
    //   "id": 2,
    //   "quote": "I had trouble sleeping for months, but after the hypnotherapy sessions, I started sleeping through the night. It was a life-changing experience.",
    //   "author": "Michael Thompson",
    // },
    // {
    //   "id": 3,
    //   "quote": "The smoking cessation program worked wonders! I’ve been smoke-free for six months now and feel better than ever. Highly recommended!",
    //   "author": "Emma Wilson",
    //   "url": "https://www.google.com/review/67890"
    // }
  ],
    title: 'Hypnose in Bern – Hypnosetherapie | Janine Aerni',
    description: 'Hypnose und Hypnosetherapie in Bern – Janine Aerni. In meiner Praxis biete ich Hypnosetherapie an, um Stress, Ängste, Phobien und mehr zu überwinden. Entdecken Sie, wie Hypnose Ihnen helfen kann, ein gesünderes und ausgeglicheneres Leben zu führen. ',
    image: {
        src: '/uploads/glowing-blocks.avif',
        alt: 'Hypnose und Hypnosetherapie in Bern'
    },
    imageHomepage: {
        src: '/janine-aerni-face-800w.png',
        alt: 'Janine Aerni – Hypnosetherapie in Bern'
    },
    hero: {
        title: 'Bern Hypnose',
        subtitle: 'Hypnosetherapie Praxis in Bern', 
        name: 'Janine Aerni', 
        text: "Ich bin Janine Aerni, Hypnosetherapeutin in Ausbildung in Bern. Mit einer warmen und unterstützenden Herangehensweise helfe ich dir, Stress, Angst, Phobien und mehr zu überwinden. Entdecke die transformative Kraft der Hypnose in einer sicheren Umgebung.",
        actions: [
            {
                text: 'Angebote',
                href: '/angebote'
            },
            {
                text: 'Kontakt & Termin buchen',
                href: '/kontakt/'
            },
            
        ]
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Hypnosetherapie',
            href: '/hypnosetherapie/',
            subLinks: [
                { 
                    text: 'Süchte und Rauchen', 
                    longText: 'Hypnose gegen Rauchen oder Süchte',
                    href: '/hypnosetherapie/suechte-rauchen/', 
                    image: { 
                        src: '/uploads/cigarette.avif', 
                        alt: 'Süchte und Rauchen',
                     } 
                },
                {   
                    text: 'Ernährung', 
                    longText: 'Hypnose für eine gesunde Ernährung',
                    href: '/hypnosetherapie/ernaehrung/', 
                    image: { 
                        src: '/uploads/food.avif', 
                        alt: 'Hypnose für eine gesunde Ernährung',
                     } 
                },
                {   
                    text: 'Ängste und Phobien', 
                    longText: 'Ängste und Phobien mit Hypnose überwinden',
                    href: '/hypnosetherapie/aengste-und-phobien/', 
                    image: { 
                        src: '/uploads/fears.avif', 
                        alt: 'Ängste und Phobien',
                     }
                },
                { 
                    text: 'Stress, Burnout und Depression', 
                    longText: 'Hypnose gegen Stress, Burnout und Depression',
                    href: '/hypnosetherapie/stress-burnout-und-depression/', 
                    image: { 
                        src: '/uploads/depression.avif', 
                        alt: 'Stress, Burnout und Depression',
                     }
                },
                { 
                    text: 'Selbstvertrauen', 
                    longText: 'Selbstvertrauen mit Hypnose stärken',
                    href: '/hypnosetherapie/selbstvertrauen/', 
                    image: { 
                        src: '/uploads/glowing-blocks.avif', 
                        alt: 'Selbstvertrauen',
                     }
                },
                { 
                    text: 'Schlafstörungen', 
                    longText: 'Schlafstörungen mit Hypnose behandeln',
                    href: '/hypnosetherapie/schlafstoerungen/',
                    image: { 
                        src: '/uploads/sleep.avif', 
                        alt: 'Schlafstörungen',
                     } }
                
            ]
        },
        {
            text: 'Angebote',
            href: '/angebote/'
        },
        {
            text: 'Blog',
            href: '/blog/'
        },
        {
            text: 'Über mich',
            href: '/janine-aerni/'
        },
        {
            text: 'Kontakt & Termin',
            href: '/kontakt/'
        },
    ],
    footerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'Hypnosetherapie',
            href: '/hypnosetherapie/'
        },
        {
            text: 'Angebote',
            href: '/angebote/'
        },
        {
            text: 'Blog',
            href: '/blog/'
        },
        {
            text: 'Über mich',
            href: '/janine-aerni/'
        },
        {
            text: 'Kontakt & Termin',
            href: '/kontakt/'
        },
    ],
    socialLinks: [
        {
            text: 'LinkedIn',
            href: 'https://www.linkedin.com/'
        }
    ],
    subscribe: {
        title: 'Subscribe to Dante Newsletter',
        text: 'One update per week. All the latest posts directly in your inbox.',
        formUrl: '#'
    },
    postsPerPage: 8
};

export default siteConfig;
