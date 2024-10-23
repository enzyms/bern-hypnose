// Import images statically
import fearsImage from '@assets/uploads/fears.png';
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
            "id": 3,
            "quote": "Ich habe die Hypnosetherapie besucht, weil ich grosse Angst vor einem medizischen Eingriff hatte. Janine Aerni hat es verstanden, mich in einen Zustand von Entspannung, innerer Ruhe und Vertrauen zu führen. Ihre kompetente und einfühlsame Art haben mich sehr überzeugt. Die mit ihr festgelegten «Anker» konnte ich vor dem Eingriff wieder herholen, so dass ich recht gelassen sein konnte.",
            "author": "Vroni Gschwend",
            "url": "https://g.co/kgs/yJrAfVx"
        },
        {
            "id": 0,
            "quote": "Die Hypnosesitzung bei Janine Aerni möchte ich deshalb weiter empfehlen weil das Eingehen auf die Klienten mit besonderem Einfühlungsvermögen und Empathie geschieht. Als neurosensitiver Mensch ist mir   Authentizität und individuelle Arbeitsweise besonders wichtig, um mich vertrauensvoll zu öffnen. Das Interesse am Klienten und die  Begeisterung, für die Arbeit sind erfrischend. Das liebevolle Eingehen auf die Menschen unterstützt den Prozess nachhaltig. Ich kann Frau Aerni wärmstens weiterempfehlen.",
            "author": "Franziska Fiedler",
            "url": "https://g.co/kgs/2j43d2y"
        },
        {
            "id": 1,
            "quote": "Ich war wegen Durchschlafproblemen bei Janine. Seit der Hypnosetherapie bei Janine schlafe ich viel besser. Ich habe mich während der Sitzung stehts geborgen und sicher gefühlt. Alles in allem eine sehr tolle Erfahrung, die ich nur weiterempfehlen kann.",
            "author": "Paula Bozic",
            "url": "https://maps.app.goo.gl/dVE5uGwXezAQ2TyV8"
        },
        {
            "id": 2,
            "quote": "Wähernd eines stressigen Tages hatte ich eine Hypnosesitzung bei Janine. Ich war unsicher, ob ich zur Ruhe komme. Dank der einfühlsamen und professionellen Art von Janine konnte ich mich total entspannen und Energie tanken. Eine sehr empfehlenswerte Auszeit, welche nachgeklungen hat.",
            "author": "Michelle Fankhauser",
            "url": "https://g.co/kgs/LDT8sut"
        },
        {
            "id": 4,
            "quote": "Für mich persönlich Hypnose wirkt Wunder ✨ und das durfte ich bei der lieben Janine in einer Hypnosetherapie wieder erfahren. Mein Thema in der Session war, ich habe grossen Scham vor dem Schreiben und Vorlesen. Gestern hab ich mich vor meinem Arbeitsteam geoutet dass ich Legasthenie habe und darum ich nie ein Journal schreibe oder sonst was im Büro erledige, was mit Schreiben zu tun hat. NOCH NICHT 💪😁 voller Motivation und Wille bleibe ich an diesem Thema dran. Es fühlt sich so leicht an, dieses Geheimnis gelüftet zu haben 🙏 Von Herzen empfehle ich Janine weiter.",
            "author": "D.S.",
        },
    ],
    title: 'Hypnose in Bern – Hypnosetherapie | Janine Aerni',
    description: 'Hypnose und Hypnosetherapie in Bern – Janine Aerni. In meiner Praxis biete ich Hypnosetherapie an, um Stress, Ängste, Phobien und mehr zu überwinden. Entdecken Sie, wie Hypnose Ihnen helfen kann, ein gesünderes und ausgeglicheneres Leben zu führen. ',
    image: {
        src: 'src/assets/uploads/glowing-blocks.png',
        alt: 'Hypnose und Hypnosetherapie in Bern'
    },
    imageHomepage: {
        src: 'src/assets/images/hypnose1.png',
        alt: 'Janine Aerni – Hypnosetherapie in Bern'
    },
    hero: {
        title: 'Bern Hypnose',
        subtitle: 'Hypnosetherapie Praxis in Bern', 
        name: 'Janine Aerni', 
        text: "Ich bin Janine Aerni, diplomierte Hypnosetherapeutin in Bern. Mit einer warmen und unterstützenden Herangehensweise helfe ich dir, Stress, Angst, Phobien und mehr zu überwinden. Entdecke die transformative Kraft der Hypnose in einer sicheren Umgebung.",
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
                    diamondPosition: 2,
                    image: runnerImage,
                },
                {
                    text: 'Kinderhypnose',
                    longText: 'Ängste und Phobien mit Hypnose überwinden',
                    href: '/hypnosetherapie/kinderhypnose/',
                    diamondPosition: 2,
                    image: childImage,
                  },
                
            ],
            subPagesTopics: [
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
                  text: 'Selbstvertrauen',
                  longText: 'Selbstvertrauen mit Hypnose stärken',
                  href: '/hypnosetherapie/selbstvertrauen/',
                  diamondPosition: 2,
                  image: glowingBlocksImage,
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
        },
        {
            text: 'Blog',
            href: '/blog/',
            diamondPosition: 1,
        },
        {
            text: 'Über mich',
            href: '/janine-aerni/',
            diamondPosition: 2,
        },
        {
            text: 'Kontakt & Termin',
            href: '/kontakt/',
            diamondPosition: 3,
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
