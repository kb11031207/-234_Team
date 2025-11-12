// Geolocation custom hook placeholder
// This will be implemented in a later task

import { useState, useEffect } from 'react';
import { GeolocationState } from '../utils/geolocation';

export const useGeolocation = (): GeolocationState => {
  const [state] = useState<GeolocationState>({
    coordinates: null,
    permission: 'unknown',
    error: null,
  });

  // Implementation will be added in a later task
  useEffect(() => {
    // Placeholder - will implement geolocation logic
  }, []);

  return state;
};