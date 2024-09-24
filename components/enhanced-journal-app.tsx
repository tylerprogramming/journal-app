'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Edit2, Moon, Sun, BarChart2, Calendar as CalendarIcon } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import Calendar from './dynamic-calendar'

interface JournalEntry {
  id: number
  date: string
  title: string
  content: string
  tags: string[]
  mood: number
}

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function EnhancedJournalApp() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [mood, setMood] = useState(5)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('journal')

  useEffect(() => {
    const storedEntries = localStorage.getItem('journalEntries')
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries))
    }
    const storedDarkMode = localStorage.getItem('darkMode')
    if (storedDarkMode) {
      setDarkMode(JSON.parse(storedDarkMode))
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('journalEntries', JSON.stringify(entries))
    }
  }, [entries, isLoading])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const addOrUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() === '' || content.trim() === '') return
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    if (editingId) {
      setEntries(entries.map(entry => 
        entry.id === editingId 
          ? { ...entry, title, content, tags: tagArray, mood }
          : entry
      ))
      setEditingId(null)
    } else {
      const newEntry: JournalEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        title,
        content,
        tags: tagArray,
        mood
      }
      setEntries([newEntry, ...entries])
    }
    setTitle('')
    setContent('')
    setTags('')
    setMood(5)
  }

  const deleteEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const editEntry = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setTitle(entry.title)
    setContent(entry.content)
    setTags(entry.tags.join(', '))
    setMood(entry.mood)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setTags('')
    setMood(5)
  }

  const filteredEntries = entries.filter(entry => 
    (filterTag === '' || entry.tags.includes(filterTag)) &&
    (searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  )

  const allTags = Array.from(new Set(entries.flatMap(entry => entry.tags)))

  const moodData = entries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    mood: entry.mood
  }))

  const entryFrequencyData = entries.reduce((acc, entry) => {
    const date = new Date(entry.date).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const frequencyChartData = Object.entries(entryFrequencyData).map(([date, count]) => ({
    date,
    count
  }))

  const calendarEvents = entries.map(entry => ({
    title: entry.title,
    start: new Date(entry.date),
    end: new Date(entry.date),
    allDay: true,
    resource: entry
  }))

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className={`max-w-6xl mx-auto p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Journal</h1>
        <div className="flex items-center space-x-2">
          <Sun className="h-4 w-4" />
          <Switch
            checked={darkMode}
            onCheckedChange={setDarkMode}
            aria-label="Toggle dark mode"
          />
          <Moon className="h-4 w-4" />
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="journal">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Entry' : 'New Entry'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addOrUpdateEntry} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
                <Textarea
                  placeholder="Write your journal entry here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-32"
                />
                <Input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full"
                />
                <div className="flex items-center space-x-2">
                  <label htmlFor="mood" className="text-sm font-medium">Mood:</label>
                  <input
                    type="range"
                    id="mood"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="w-full max-w-xs"
                  />
                  <span>{mood}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Word count: {content.trim().split(/\s+/).filter(Boolean).length}
                  </span>
                  <div>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={cancelEdit} className="mr-2">
                        Cancel
                      </Button>
                    )}
                    <Button type="submit">{editingId ? 'Update' : 'Add'} Entry</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[calc(100vh-400px)]">
            {filteredEntries.map(entry => (
              <Card key={entry.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{entry.title}</span>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editEntry(entry)}
                        className="mr-2"
                        aria-label="Edit entry"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEntry(entry.id)}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleString()}</p>
                    <div className="flex space-x-1">
                      {entry.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{entry.content}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Mood: {entry.mood}/10</p>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="analytics">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mood Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[1, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mood" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Entry Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={frequencyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar">
          <Card>
            <CardContent>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100vh - 200px)' }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}