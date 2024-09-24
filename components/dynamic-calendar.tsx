'use client'

import dynamic from 'next/dynamic'

const Calendar = dynamic(
  () => import('react-big-calendar').then((mod) => mod.Calendar),
  { ssr: false }
)

export default Calendar