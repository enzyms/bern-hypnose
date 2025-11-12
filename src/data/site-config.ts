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

export type Testimonial = {
    tid: number;
    quote: string;
    author: string;
    url?: string;
}

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
    testimonials?: Testimonial[];
};

const siteConfig: SiteConfig = {
    testimonials: [
        {
            "tid": 0,
            "quote": "Ich habe die Hypnosetherapie besucht, weil ich grosse Angst vor einem medizischen Eingriff hatte. Janine Aerni hat es verstanden, mich in einen Zustand von Entspannung, innerer Ruhe und Vertrauen zu führen. Ihre kompetente und einfühlsame Art haben mich sehr überzeugt. Die mit ihr festgelegten «Anker» konnte ich vor dem Eingriff wieder herholen, so dass ich recht gelassen sein konnte.",
            "author": "Vroni Gschwend",
            "url": "https://g.co/kgs/yJrAfVx"
        },
        {
            "tid": 1,
            "quote": "Die Hypnosesitzung bei Janine Aerni möchte ich deshalb weiter empfehlen weil das Eingehen auf die Klienten mit besonderem Einfühlungsvermögen und Empathie geschieht. Als neurosensitiver Mensch ist mir   Authentizität und individuelle Arbeitsweise besonders wichtig, um mich vertrauensvoll zu öffnen. Das Interesse am Klienten und die  Begeisterung, für die Arbeit sind erfrischend. Das liebevolle Eingehen auf die Menschen unterstützt den Prozess nachhaltig. Ich kann Frau Aerni wärmstens weiterempfehlen.",
            "author": "Franziska Fiedler",
            "url": "https://g.co/kgs/2j43d2y"
        },
        {
            "tid": 2,
            "quote": "Ich war wegen Durchschlafproblemen bei Janine. Seit der Hypnosetherapie bei Janine schlafe ich viel besser. Ich habe mich während der Sitzung stehts geborgen und sicher gefühlt. Alles in allem eine sehr tolle Erfahrung, die ich nur weiterempfehlen kann.",
            "author": "Paula Bozic",
            "url": "https://maps.app.goo.gl/dVE5uGwXezAQ2TyV8"
        },
        {
            "tid": 3,
            "quote": "Wähernd eines stressigen Tages hatte ich eine Hypnosesitzung bei Janine. Ich war unsicher, ob ich zur Ruhe komme. Dank der einfühlsamen und professionellen Art von Janine konnte ich mich total entspannen und Energie tanken. Eine sehr empfehlenswerte Auszeit, welche nachgeklungen hat.",
            "author": "Michelle Fankhauser",
            "url": "https://g.co/kgs/LDT8sut"
        },
        {
            "tid": 4,
            "quote": "Für mich persönlich Hypnose wirkt Wunder ✨ und das durfte ich bei der lieben Janine in einer Hypnosetherapie wieder erfahren. Mein Thema in der Session war, ich habe grossen Scham vor dem Schreiben und Vorlesen. Gestern hab ich mich vor meinem Arbeitsteam geoutet dass ich Legasthenie habe und darum ich nie ein Journal schreibe oder sonst was im Büro erledige, was mit Schreiben zu tun hat. NOCH NICHT 💪😁 voller Motivation und Wille bleibe ich an diesem Thema dran. Es fühlt sich so leicht an, dieses Geheimnis gelüftet zu haben 🙏 Von Herzen empfehle ich Janine weiter.",
            "author": "D.S.",
        },
        {
            "tid": 5,
            "quote": "In einer angenehmen Umgebung wurde ich von Janine gut über den Ablauf aufgeklärt. Ich habe mich jederzeit sehr wohl gefühlt und bin voller neuer Energie nach Hause gegangen. Mit der Hypnosetherapie und den mitgegebenen Übungen konnte ich mein Thema ideal behandeln und überwinden. Die Anwendung kann ich auch auf andere Themen übertragen. Es hat mir eine neue Lebensqualität gebracht. Ich empfehle die Hypnosetherapie von Janine sehr.",
            "author": "Katrin Breuer",
            "url": "https://g.co/kgs/g9JUYgs"
        },
        {
            "tid": 6,
            "quote": "Es war meine erste Hypnose und bei Janine und ich fühlte mich bei Ihr direkt Wohl . Sie hat sich Zeit genommen und mich mit Ihrer Freundlichen Art und mit viel Geduld und Positiven Aspekten geleitet und für das bin ich sehr dankbar. Vielen Dank! Ich kann Janine nur weiterempfehlen",
            "author": "Jasmin Miescher",
            "url": "https://g.co/kgs/MUQ2kpX"
        },
        {
            "tid": 7,
            "quote": "die hypnose war sehr intensiv und tiefgründig. vielen dank janine!",
            "author": "Yves",
            "url": "https://g.co/kgs/sUhiE6p"
        },
        {
            "tid": 8,
            "quote": "Janine Aerni ist eine sehr authentische, kompetente Hypnosetherapeutin, mit einem grossen Herz. Man fühlt sich schon bei der Begrüssung in der schönen Praxis sehr wohl  und gut aufgehoben. Ich wurde sehr achtsam und doch auch kraftvoll durch die Hypnose begleitet , bzw. angeleitet, genau so, wie ich es mir wünschte. Die Selbsthypnose Anleitung konnte ich gut in meinem Alltag integrieren und sie unterstützt mich in meinem Anliegen. Ich bin Janine Aerni für diese einfühlsame und effektive Hypnosetherapie sehr dankbar und kann sie wärmstens weiterempfehlen.",
            "author": "Alexandra Sidler",
            "url": "https://g.co/kgs/p1syPib"
        },
        {
            "tid": 9,
            "quote": "Sehr kompetente, rücksichtsvolle und feinfühlige Hypnosetherapeutin. In einem sehr angenehmen und entspannenden Setting. Nachhaltiges und wirkungsvolles Erlebnis. Sehr zu empfehlen",
            "author": "Anemone Brunner",
            "url": "https://g.co/kgs/Rpj2hhC"
        },
        {
            "tid": 10,
            "quote": "Ich habe mich bei Janine von Anfang an verstanden, sicher und gut aufgehoben gefühlt. Während der Hypnosesitzung hatte ich den Eindruck, dass sie genau spürt, was ich gerade brauche, als würde sie zwischen den Zeilen lesen können. Ihre einfühlsame Art und die ruhige Atmosphäre haben es mir leicht gemacht, loszulassen und mich auf den Prozess einzulassen. Eine wirklich wertvolle Erfahrung, für die ich sehr dankbar bin.",
            "author": "Claes Lennman",
            "url": "https://g.co/kgs/ddjY2rf"
        },
        {
            "tid": 11,
            "quote": "Habe mich sehr wohl gefühlt! Herzlichen Dank für deine einfühlsame, ruhige und unterstützende Art und Weise, mit der du mich mittels Hypnose wieder ein Stück näher zu mir selbst gebracht hast!",
            "author": "Christine Eva Roelli",
            "url": "https://g.co/kgs/BTQth3X"
        },
        {
            "tid": 12,
            "quote": "War sehr eindrücklich und war sehr gut",
            "author": "Walter Stoll",
            "url": "https://g.co/kgs/fukhcDw"
        },
        {
            "tid": 13,
            "quote": "Vielen Dank Janine für Deine professionelle Arbeit und für die Art, wie Du unsere Sitzung gestaltet hast!",
            "author": "Hannes Mueller",
            "url": "https://g.co/kgs/5vKcJRE"
        },
        {
            "tid": 14,
            "quote": "Ich war zum 1. Mal bei Janine und bereits von Beginn an, habe ichmich sehr wohl gefühlt. Janine hört super zu und gibt einem das Gefühl verstanden zu werden was sehr schön ist. Die ganze Sitzung war sehr spannend, angenehm und hilfreich. Mein Gefühl gegenüber meinem Problem, weshalb ich dort war, ist ganz anders und ich weiss nun wie ich es besser angehen kann.",
            "author": "Jasmin Stöckli",
            "url": "https://g.co/kgs/XwM3bgY"
        },
        {
            "tid": 15,
            "quote": "Es war meine erste Hypnose und ich bin sehr dankbar habe ich dies bei Janine gemacht. Ich habe mich direkt durch ihre offenherzliche, authentische und kompetente Art wohlgefühlt. Die Hypnose unterstützt mich sehr mit meinen Angelegenheiten. Ich kann Janine Aerni nur weiterempfehlen.☺️🙏🏼",
            "author": "Nina Cotting",
            "url": "https://g.co/kgs/z1vSrXV"
        },
        {
            "tid": 16,
            "quote": "Habe mich bei Janine Aerni sehr wohl gefühlt. Mit ihrer empathischen, authentischen Art und ihrem proffessionellen Vorgehen kann Heilung unterstützt und gefördert werden. Ich kann Janine jederzeit weiterempfehlen.",
            "author": "Poly Acrylli",
            "url": "https://g.co/kgs/oAtRgkm"
        },
        {
            "tid": 17,
            "quote": "Ich war mit meinem Kind bei Janine, weil es panische Angst vor der regelmässigen Blutentnahme hatte. Diese war nur unter Lachgas möglich. Janine hat es gemeinsam mit meinem Kind geschafft, dass wir heute eine angstgeminderte, ruhige Blutentnahme ohne Lachgas hatten. Ich bin ihr unendlich dankbar für ihre tolle und einfühlsame Arbeit.",
            "author": "Michelle Fankhauser",
            "url": "https://g.co/kgs/F9THu2T"
        },
        {
            "tid": 18,
            "quote": "Die Hypnosesitzungen mit Janine sind super! Sie aktivieren und bewegen auf beste Art und Weise. Janine führt die Sitzungen äusserst professionell, mit vollster Aufmerksamkeit, mit viel Lebenserfahrung und ebensolchem Feingefühl. Man fühlt sich rundum gut aufgehoben. Top! Herzlichen Dank für diese tiefgreifende und wertvolle Erfahrung.",
            "author": "D.S.D.",
        },
        {
            "tid": 19,
            "quote": "Die Therapie bei Janine Aerni hat unserer Tochter sehr gut getan. Durch eine individuell angepasste Traumreise hat sie heute Möglichkeiten, die ihr Sicherheit und Selbstvertrauen geben. Janine Aerni hat eine sehr warme und einfühlsame Art und hat sich sehr viel Zeit genommen. Viele der Hilfen wendet unsere Tochter von sich aus im Alltag an. Die Wirkung ist nachhaltig. Ich kann die Therapie empfehlen.",
            "author": "Lea Tschirren",
            "url": "https://maps.app.goo.gl/ragLMPJzG8MMC7Lv9"
        },
        {
            "tid": 100000,
            "quote": "Demo. Pass props like this: <Testimonials ids={[0, 1, 2]} />",
            "author": "Name or initials",
            "url": "https://google.link"
        }

    ],
    title: 'Hypnose in Bern – Hypnosetherapie | Janine Aerni',
    titleSuffix: 'Hypnose in Bern | Janine Aerni',
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
