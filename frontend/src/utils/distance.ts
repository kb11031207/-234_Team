// Distance calculation utilities placeholder
// This will be implemented in a later task

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Placeholder function to be implemented using geolib
export const calculateDistance = (
  _point1: Coordinates,
  _point2: Coordinates
): number => {
  // Will use geolib.getDistance() in implementation
  return 0; // Placeholder
};

export const isWithinRadius = (
  _center: Coordinates,
  _point: Coordinates,
  _radiusInMiles: number
): boolean => {
  // Will implement using calculateDistance
  return false; // Placeholder
};