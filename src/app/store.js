import { writable } from 'svelte/store';

// Create writable stores for the selected profile and topic
export const pageTitle = writable(null);
export const selectedProfile = writable({ id: 'adult', name: 'Erwachsene', description: 'Short description here' }); // set to null when we have children profile
export const selectedTopic = writable(null);
export const selectedDuration = writable(null);
export const selectedAmbientSound = writable(null);
export const currentStep = writable(2); // set to 1 when we have children profile

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


export const audioPlayer = writable();
export const ambientPlayer = writable();
export const status = writable('default');
export const isPlaying = writable(false);
export const index = writable(0);


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