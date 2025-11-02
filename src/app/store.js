import { writable } from 'svelte/store';
import imgRelaxation from '@assets/app/introspection.png';
import imgPositiveAffirmations from '@assets/app/child.png';
import imgRichtigWieIchBin from '@assets/app/thinking.png';
import imgInnererOrt from '@assets/app/flowers-field.png';
import imgGemuetlicherHerbsttag from '@assets/app/trail-two-persons.png';
import imgWanderungInDenBergen from '@assets/app/landscape5.png';
import imgAmFluss from '@assets/app/forest.png';

// Create writable stores for the selected profile and topic
export const pageTitle = writable(null);
export const showIntroCover = writable(true);
export const showContent = writable(false);
export const selectedProfile = writable({ id: 'adult', name: 'Erwachsene', description: 'Short description here' }); // set to null when we have children profile
export const selectedTopic = writable(null);
export const topicsAdult = [
    { id: 'gemuetlicher-herbsttag', name: 'Gemütlicher Herbsttag', duration: 7, image: imgGemuetlicherHerbsttag },
    { id: 'wanderung-in-den-bergen', name: 'Wanderung in den Bergen', duration: 7, image: imgWanderungInDenBergen },
    { id: 'am-fluss', name: 'Am Fluss', duration: 7, image: imgAmFluss },
    { id: 'innerer-ort', name: 'Innerer Wohlfühlort', duration: 15, image: imgInnererOrt },
    { id: 'relaxation', name: 'Entspannung', duration: 12, image: imgRelaxation },
    { id: 'ich-bin-richtig', name: 'Ich bin richtig wie ich bin', duration: 8, image: imgRichtigWieIchBin },
    { id: 'positive-affirmations', name: 'Positive Affirmationen', duration: 7, image: imgPositiveAffirmations }
];
export const selectedDuration = writable(null);
export const ambientSounds = writable([
    { id: 'etherium', name: 'Entspannungsmusik' },
    { id: 'forest', name: 'Vogelstimmen' },
    { id: 'sea', name: 'Meeresgeräusche' },
    { id: 'rain', name: 'Regen im Wald' },
    { id: 'fire', name: 'Feuerstellen' },
    { id: 'none', name: 'Ohne Geräusche' }
]);
export const selectedAmbientSound = writable(null);
export const currentStep = writable(2); // set to 1 when we have children profile

export const audioPlayer = writable();
export const ambientPlayer = writable();
export const status = writable('default');
export const isPlaying = writable(false);
export const index = writable(0);

export const currentTime = writable(0);
export const duration = writable(0);

export function nextStep() {
    currentStep.update((n) => (n < 5 ? n + 1 : n));
}

export function prevStep() {
    currentStep.update((n) => (n > 1 ? n - 1 : n));
}

export function clearStore() {
    currentStep.set(2);
}

export function selectAmbientSound() {
    currentStep.set(3);
}

// export const trackList = writable([
// 	{
// 		title: 'Relaxation',
// 		artist: 'Janine',
// 		file: '/audio/adult-relaxation.mp3',
// 	},
// 	{
// 		title: 'Symphony no. 5 in Cm, Op. 67',
// 		artist: 'Ludwig van Beethoven',
// 		file: 'https://sveltejs.github.io/assets/music/beethoven.mp3'
// 	}
// ]);

// export const addTrack = track => {
// 	trackList.update(v => [...v, track])
// };
