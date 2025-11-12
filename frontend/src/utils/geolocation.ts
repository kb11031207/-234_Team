// Geolocation utilities placeholder
// This will be implemented in a later task

export interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  error: GeolocationPositionError | null;
}

// Placeholder functions to be implemented
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return Promise.reject(new Error('Not implemented yet'));
};

export const watchPosition = (): number => {
  return 0; // Placeholder
};