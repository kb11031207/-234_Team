import { getDistance } from 'geolib'

// Distance calculation utilities

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two points in meters
 * @param point1 First point with latitude and longitude
 * @param point2 Second point with latitude and longitude
 * @returns Distance in meters
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  return getDistance(
    { latitude: point1.latitude, longitude: point1.longitude },
    { latitude: point2.latitude, longitude: point2.longitude }
  )
}

/**
 * Calculate distance between two points in miles
 * @param point1 First point with latitude and longitude
 * @param point2 Second point with latitude and longitude
 * @returns Distance in miles
 */
export const calculateDistanceInMiles = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const distanceInMeters = calculateDistance(point1, point2)
  // Convert meters to miles (1 mile = 1609.34 meters)
  return distanceInMeters / 1609.34
}

/**
 * Calculate distance between two points in kilometers
 * @param point1 First point with latitude and longitude
 * @param point2 Second point with latitude and longitude
 * @returns Distance in kilometers
 */
export const calculateDistanceInKilometers = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const distanceInMeters = calculateDistance(point1, point2)
  // Convert meters to kilometers (1 km = 1000 meters)
  return distanceInMeters / 1000
}

/**
 * Check if a point is within a radius of a center point
 * @param center Center point with latitude and longitude
 * @param point Point to check with latitude and longitude
 * @param radiusInMiles Radius in miles
 * @returns True if point is within radius, false otherwise
 */
export const isWithinRadius = (
  center: Coordinates,
  point: Coordinates,
  radiusInMiles: number
): boolean => {
  const distanceInMiles = calculateDistanceInMiles(center, point)
  return distanceInMiles <= radiusInMiles
}

/**
 * Check if a point is within a radius of a center point (in kilometers)
 * @param center Center point with latitude and longitude
 * @param point Point to check with latitude and longitude
 * @param radiusInKilometers Radius in kilometers
 * @returns True if point is within radius, false otherwise
 */
export const isWithinRadiusKilometers = (
  center: Coordinates,
  point: Coordinates,
  radiusInKilometers: number
): boolean => {
  const distanceInKilometers = calculateDistanceInKilometers(center, point)
  return distanceInKilometers <= radiusInKilometers
}

/**
 * Filter points within a radius of a center point
 * @param center Center point with latitude and longitude
 * @param points Array of points to filter
 * @param radiusInMiles Radius in miles
 * @returns Array of points within radius
 */
export const filterPointsWithinRadius = <T extends Coordinates>(
  center: Coordinates,
  points: T[],
  radiusInMiles: number
): T[] => {
  return points.filter((point) => isWithinRadius(center, point, radiusInMiles))
}

/**
 * Filter points within a radius of a center point (in kilometers)
 * @param center Center point with latitude and longitude
 * @param points Array of points to filter
 * @param radiusInKilometers Radius in kilometers
 * @returns Array of points within radius
 */
export const filterPointsWithinRadiusKilometers = <T extends Coordinates>(
  center: Coordinates,
  points: T[],
  radiusInKilometers: number
): T[] => {
  return points.filter((point) =>
    isWithinRadiusKilometers(center, point, radiusInKilometers)
  )
}

/**
 * Convert miles to kilometers
 * @param miles Distance in miles
 * @returns Distance in kilometers
 */
export const milesToKilometers = (miles: number): number => {
  return miles * 1.60934
}

/**
 * Convert kilometers to miles
 * @param kilometers Distance in kilometers
 * @returns Distance in miles
 */
export const kilometersToMiles = (kilometers: number): number => {
  return kilometers / 1.60934
}
