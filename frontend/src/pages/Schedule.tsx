import React from 'react'
import ScheduleGantt from '../components/ScheduleGantt'

const Schedule: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Schedule vs Actuals</h2>
      <p className="text-sm text-gray-500 mt-1">Compare timetable arrivals against actual times — select a route then a trip</p>
    </div>
    <ScheduleGantt />
  </div>
)

export default Schedule
