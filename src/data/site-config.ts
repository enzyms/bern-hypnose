// Import images statically
import fearsImage from '@assets/uploads/fears.png';

// Import Google reviews data for dynamic title
import googleReviews from './google-reviews.json';
import thinkingImage from '@assets/uploads/thinking.png';
import cigaretteImage from '@assets/uploads/cigarette.png';
import glassImage from '@assets/uploads/glass2.png';
import foodImage from '@assets/uploads/food.png';
import depressionImage from '@assets/uploads/depression.png';
import glowingBlocksImage from '@assets/uploads/glowing-blocks.png';
import sleepImage from '@assets/uploads/sleep.png';
import childImage from '@assets/uploads/child.png';
import painImage from '@assets/uploads/pain-free.png';
import runnerImage from '@assets/uploads/runner.png';
import birdImage from '@assets/uploads/bird1.png';
import womanImage from '@assets/uploads/woman-abstract-2.png';

export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    longText?: string;
    href: string;
    subPages?: Link[];
    subPagesTopics?: Link[];
    image?: Image;
    thumb?: Image;
    diamondPosition?: number;
    id?: string;
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

// Testimonials are now stored in google-reviews.json and fetched via scripts/fetch-google-reviews.js

export type SiteConfig = {
    logo?: Image;
    title: string;
    titleSuffix?: string;
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
};

const siteConfig: SiteConfig = {
    title: `Hypnosetherapie Bern ★ ${googleReviews.overallRating}.0 (${googleReviews.totalReviewCount} Bewertungen) | Janine Aerni`,
    titleSuffix: 'Hypnosetherapie Bern | Janine Aerni',
    description: 'Hypnosetherapie Bern – Als diplomierte Hypnosetherapeutin begleite ich dich einfühlsam auf deinem Weg zu mehr Wohlbefinden. In meiner Praxis an der Eigerstrasse findest du Raum für Veränderung.',
    image: {
        src: 'src/assets/uploads/glowing-blocks.png',
        alt: 'Hypnose und Hypnosetherapie in Bern'
    },
    imageHomepage: {
        src: '/janine-aerni-hypnose-bern-600w.jpg',
        alt: 'Janine Aerni – Hypnosetherapie in Bern'
    },
    hero: {
        title: 'Bern Hypnose',
        subtitle: 'Hypnosetherapie Bern – Praxis für Hypnose',
        name: 'Janine Aerni',
        text: "Ich bin [Janine Aerni](/janine-aerni/), diplomierte Hypnosetherapeutin in Bern. Mit einer warmen und unterstützenden Herangehensweise helfe ich dir durch Hypnosetherapie, Stress, Angst, Phobien und mehr zu überwinden. Entdecke die transformative Kraft der Hypnose in meiner Berner Praxis.",
        actions: [
            {
                text: 'Angebote',
                href: '/angebote'
            },
            {
                text: 'Kontakt buchen',
                href: '/kontakt/'
            },

        ]
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/',
            diamondPosition: 1
        },
        {
            text: 'Hypnosetherapie',
            href: '/hypnosetherapie/',
            diamondPosition: 2,
            id: 'hypnotherapy',
            subPages: [
                {
                    text: 'Hypnosetherapie allgemein',
                    longText: 'Wann kann Hypnose helfen und für wen?',
                    href: '/hypnosetherapie/',
                    id: 'hypnotherapy2',
                    diamondPosition: 2,
                    image: birdImage,
                },
                {
                    text: 'Sporthypnose',
                    longText: 'Wann kann Hypnose helfen und für wen?',
                    href: '/hypnosetherapie/sporthypnose/',
                    id: 'hypnotherapy-sport',
                    diamondPosition: 2,
                    image: runnerImage,
                },
                {
                    text: 'Kinderhypnose',
                    longText: 'Sanfte Unterstützung für dein Kind',
                    href: '/hypnosetherapie/kinderhypnose/',
                    id: 'hypnotherapy-children',
                    diamondPosition: 2,
                    image: childImage,
                },
                {
                    text: 'Hypnose spezifisch für Frauen',
                    longText: 'Unterstützung in jeder Lebensphase durch Hypnose',
                    href: '/hypnosetherapie/hypnose-fuer-frauen/',
                    id: 'hypnotherapy-women',
                    diamondPosition: 2,
                    image: womanImage,
                },

            ],
            subPagesTopics: [
                {
                    text: 'Selbstvertrauen',
                    longText: 'Selbstvertrauen mit Hypnose stärken',
                    href: '/hypnosetherapie/selbstvertrauen/',
                    diamondPosition: 2,
                    image: glowingBlocksImage,
                },
                {
                    text: 'Stress, Burnout und Depression',
                    longText: 'Hypnose gegen Stress, Burnout und Depression',
                    href: '/hypnosetherapie/stress-burnout-und-depression/',
                    diamondPosition: 2,
                    image: depressionImage,
                },
                {
                    text: 'Ängste und Phobien',
                    longText: 'Ängste und Phobien mit Hypnose überwinden',
                    href: '/hypnosetherapie/aengste-und-phobien/',
                    diamondPosition: 2,
                    image: fearsImage,
                },
                {
                    text: 'Rauchstopp mit Hypnose',
                            longText: 'Rauchen durch Hypnose aufgeben',
                            href: '/hypnosetherapie/abhaengigkeit/rauchstopp-mit-hypnose/',
                            image: cigaretteImage,
                    diamondPosition: 2,
                },
                {
                    text: 'Hypnose gegen Alkoholsucht',
                            longText: 'Alkoholsucht mit Hypnose behandeln',
                            href: '/hypnosetherapie/abhaengigkeit/hypnose-gegen-alkoholsucht/',
                            image: glassImage,
                    diamondPosition: 2,
                },
                {
                    text: 'Abhängigkeiten',
                    longText: 'Hypnose gegen Rauchen und Abhängigkeiten',
                    href: '/hypnosetherapie/abhaengigkeit/',
                    diamondPosition: 2,
                    image: cigaretteImage,
                    id: 'dependencies',
                    subPagesTopics: [
                        {
                            text: 'Rauchstopp mit Hypnose',
                            longText: 'Rauchen durch Hypnose aufgeben',
                            href: '/hypnosetherapie/abhaengigkeit/rauchstopp-mit-hypnose/',
                            image: cigaretteImage,
                        },
                        {
                            text: 'Hypnose gegen Alkoholsucht',
                            longText: 'Alkoholsucht mit Hypnose behandeln',
                            href: '/hypnosetherapie/abhaengigkeit/hypnose-gegen-alkoholsucht/',
                            image: glassImage,
                        },
                    ],
                },
                {
                    text: 'Ernährung und Abnehmen',
                    longText: 'Hypnose für eine gesunde Ernährung',
                    href: '/hypnosetherapie/ernaehrung-und-abnehmen/',
                    diamondPosition: 2,
                    image: foodImage,
                },
                {
                    text: 'Schlafstörungen',
                    longText: 'Schlafstörungen mit Hypnose behandeln',
                    href: '/hypnosetherapie/schlafstoerungen/',
                    diamondPosition: 2,
                    image: sleepImage,
                },
                {
                    text: 'Schmerzen',
                    longText: 'Schmerzen mit Hypnose behandeln',
                    href: '/hypnosetherapie/schmerzen/',
                    diamondPosition: 2,
                    image: painImage,
                },
                {
                    text: 'Zwangsstörungen',
                    longText: 'Zwangsstörungen mit Hypnose behandeln',
                    href: '/hypnosetherapie/zwangsstoerungen/',
                    diamondPosition: 2,
                    image: thinkingImage,
                },
            ],

        },
        {
            text: 'Fragen',
            href: '/was-ist-hypnose/',
            diamondPosition: 2,
        },
        {
            text: 'Angebote',
            href: '/angebote/',
            diamondPosition: 3,
            subPages: [
                {
                    text: 'Preise Hypnosetherapie',
                    href: '/angebote/',
                    diamondPosition: 3,
                },
                {
                    text: 'Präsentationen über Hypnose',
                    href: '/angebote/praesentationen-ueber-hypnose/',
                    diamondPosition: 3,
                },
            ],
        },
        {
            text: 'Blog',
            href: '/blog/',
            diamondPosition: 1,
        },
        {
            text: 'App',
            href: '/app/',
            diamondPosition: 2,
        },
        {
            text: 'Über mich',
            href: '/janine-aerni/',
            diamondPosition: 2,
        },
        {
            text: 'Kontakt',
            href: '/kontakt/',
            diamondPosition: 3,
        },
        {
            text: 'Termin',
            href: '/termin/',
            diamondPosition: 2,
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
            text: 'Kontakt',
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
