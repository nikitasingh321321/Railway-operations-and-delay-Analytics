// Shared TypeScript interfaces matching backend Pydantic schemas

export interface KPISummary {
  total_trains: number
  on_time_trains: number
  delayed_trains: number
  cancelled_trains: number
  on_time_pct: number
  avg_delay_minutes: number
  worst_route: string | null
  total_trips_today: number
}

export interface DelayBucket {
  bucket: string
  count: number
}

export interface DelayByHour {
  hour: number
  avg_delay: number
}

export interface DelayCause {
  cause: string
  count: number
}

export interface MonthlyTrend {
  month: string
  avg_delay: number
  total_events: number
  cancelled: number
}

export interface TrainSummary {
  route_id: string
  train_number: string
  train_name: string
  total_events: number
  on_time: number
  delayed: number
  cancelled: number
  avg_delay: number
  on_time_pct: number
  worst_station: string | null
}

export interface StationSummary {
  stop_id: string
  stop_name: string
  avg_delay: number
  on_time_pct: number
  worst_day: string | null
  total_events: number
  delayed: number
  cancelled: number
}

export interface StationDailyDelay {
  date: string
  avg_delay: number
}

export interface RouteItem {
  route_id: string
  route_short_name: string | null
  route_long_name: string | null
}

export interface TripItem {
  trip_id: string
  trip_headsign: string | null
  direction_id: number | null
}

export interface ScheduleStop {
  stop_sequence: number
  stop_id: string
  stop_name: string
  scheduled_arrival: string | null
  actual_arrival: string | null
  delay_minutes: number | null
  status: string | null
}

export interface IngestStatus {
  last_poll: string | null
  events_today: number
  message: string
}

export interface DateRange {
  startDate: string
  endDate: string
}
