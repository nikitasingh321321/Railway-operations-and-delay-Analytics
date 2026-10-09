import React, { createContext, useContext, useState } from 'react'
import type { DateRange } from '../types'

interface FilterContextType {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
}

const today = new Date()
const thirtyDaysAgo = new Date(today)
thirtyDaysAgo.setDate(today.getDate() - 30)

const fmt = (d: Date) => d.toISOString().split('T')[0]

const FilterContext = createContext<FilterContextType>({
  dateRange: { startDate: fmt(thirtyDaysAgo), endDate: fmt(today) },
  setDateRange: () => {},
})

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: fmt(thirtyDaysAgo),
    endDate: fmt(today),
  })

  return (
    <FilterContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilter = () => useContext(FilterContext)
