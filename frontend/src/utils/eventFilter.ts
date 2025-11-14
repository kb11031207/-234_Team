// Event filtering utilities

import { Event } from '../types'

/**
 * Check if an event is within the valid time window (24 hours after event date)
 * Events are shown if:
 * - They haven't happened yet (future events) - always show
 * - They happened less than 24 hours ago (recent events)
 * Events that happened more than 24 hours ago are hidden
 * @param event Event to check
 * @param windowHours Hours after event date to consider valid (default: 24)
 * @returns True if event is within the valid time window, false otherwise
 */
export const isEventWithinTimeWindow = (
  event: Event,
  windowHours: number = 24
): boolean => {
  // If event doesn't have a date, consider it valid (always show)
  if (!event.event_date) {
    return true
  }

  try {
    const eventDate = new Date(event.event_date)
    const now = new Date()
    
    // Calculate time difference in hours (positive = past, negative = future)
    const hoursDifference = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60)
    
    // Event is valid if:
    // 1. It hasn't happened yet (hoursDifference < 0) - show all future events
    // 2. It happened less than windowHours ago (0 <= hoursDifference <= windowHours)
    // Don't show events that happened more than windowHours ago (hoursDifference > windowHours)
    return hoursDifference <= windowHours
  } catch (error) {
    console.error('Error parsing event date:', error)
    // If date parsing fails, consider it invalid (don't show)
    return false
  }
}

/**
 * Check if an event date has passed
 * @param event Event to check
 * @returns True if event date has passed, false otherwise
 */
export const hasEventPassed = (event: Event): boolean => {
  if (!event.event_date) {
    return false // No date, consider it hasn't passed
  }

  try {
    const eventDate = new Date(event.event_date)
    const now = new Date()
    return eventDate.getTime() < now.getTime()
  } catch (error) {
    console.error('Error parsing event date:', error)
    return false
  }
}

/**
 * Check if an event date is in the future
 * @param event Event to check
 * @returns True if event date is in the future, false otherwise
 */
export const isEventInFuture = (event: Event): boolean => {
  if (!event.event_date) {
    return true // No date, consider it future
  }

  try {
    const eventDate = new Date(event.event_date)
    const now = new Date()
    return eventDate.getTime() > now.getTime()
  } catch (error) {
    console.error('Error parsing event date:', error)
    return false
  }
}

/**
 * Filter events to only show those within the valid time window
 * @param events Array of events to filter
 * @param windowHours Hours before/after event date to consider valid (default: 24)
 * @returns Filtered array of events within the time window
 */
export const filterEventsByTimeWindow = (
  events: Event[],
  windowHours: number = 24
): Event[] => {
  return events.filter((event) => isEventWithinTimeWindow(event, windowHours))
}

/**
 * Get time remaining until event or time since event
 * @param event Event to check
 * @returns Object with hours and minutes until/since event, or null if no date
 */
export const getEventTimeRemaining = (
  event: Event
): { hours: number; minutes: number; isPast: boolean } | null => {
  if (!event.event_date) {
    return null
  }

  try {
    const eventDate = new Date(event.event_date)
    const now = new Date()
    const diffMs = eventDate.getTime() - now.getTime()
    const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60))
    
    return {
      hours: diffHours,
      minutes: diffMinutes,
      isPast: diffMs < 0,
    }
  } catch (error) {
    console.error('Error calculating time remaining:', error)
    return null
  }
}

