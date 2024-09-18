import { writable } from 'svelte/store';

// Create writable stores for the selected profile and topic
export const selectedProfile = writable(null);
export const selectedTopic = writable(null);
export const selectedDuration = writable(7);
export const selectedAmbientSound = writable(null);
export const currentStep = writable(1);

export function nextStep() {
    currentStep.update((n) => (n < 5 ? n + 1 : n));
}

export function prevStep() {
    currentStep.update((n) => (n > 1 ? n - 1 : n));
}
