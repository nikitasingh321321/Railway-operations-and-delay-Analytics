import axios from 'axios'
import type { RouteItem, TripItem, ScheduleStop } from '../types'

export const fetchRoutes = () =>
  axios.get<RouteItem[]>('/api/schedule/routes').then(r => r.data)

export const fetchTripsForRoute = (routeId: string) =>
  axios.get<TripItem[]>(`/api/schedule/routes/${encodeURIComponent(routeId)}/trips`).then(r => r.data)

export const fetchTripSchedule = (tripId: string) =>
  axios.get<ScheduleStop[]>(`/api/schedule/trip/${encodeURIComponent(tripId)}`).then(r => r.data)
