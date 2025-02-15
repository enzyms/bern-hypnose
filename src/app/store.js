import { writable } from 'svelte/store';

// Create writable stores for the selected profile and topic
export const selectedProfile = writable({ id: 'adult', name: 'Erwachsene', description: 'Short description here' }); // set to null when we have children profile
export const selectedTopic = writable(null);
export const selectedDuration = writable(7);
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
    console.log('cleared');
    // Reset any other store values you have
}
