import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useEvents } from './store'
import InputBar from './components/InputBar'
import ListView from './components/ListView'
import CalendarView from './components/CalendarView'
import EventModal from './components/EventModal'
import SettingsModal from './components/SettingsModal'
import './App.css'

dayjs.locale('zh-cn')

export default function App() {
  const { events, addEvent, updateEvent, deleteEvent, toggleDone } = useEvents()
  const [view, setView] = useState('list')
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [editingEvent, setEditingEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  function handleSaveEvent(ev) {
    if (editingEvent && editingEvent.id) {
      updateEvent(editingEvent.id, ev)
    } else {
      addEvent(ev)
    }
    setShowModal(false)
    setEditingEvent(null)
  }

  function handleEdit(ev) {
    setEditingEvent(ev)
    setShowModal(true)
  }

  function handleNewFromDate(date) {
    setEditingEvent({ date: date.format('YYYY-MM-DD') })
    setShowModal(true)
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">Capy 日程</span>
        <nav className="view-tabs">
          <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            列表
          </button>
          <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
            日历
          </button>
        </nav>
        <button className="btn-settings" onClick={() => setShowSettings(true)} title="AI 设置">
          ⚙
        </button>
        <button className="btn-new" onClick={() => { setEditingEvent(null); setShowModal(true) }}>
          + 新建
        </button>
      </header>

      <InputBar onAdd={addEvent} />

      <main className="app-main">
        {view === 'list' ? (
          <ListView
            events={events}
            onToggle={toggleDone}
            onEdit={handleEdit}
            onDelete={deleteEvent}
          />
        ) : (
          <CalendarView
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEdit={handleEdit}
            onNewFromDate={handleNewFromDate}
          />
        )}
      </main>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showModal && (
        <EventModal
          initial={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}
