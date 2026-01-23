'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Utility functions for date manipulation
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const days: Date[] = [];
  const startDay = firstDay.getDay();

  // Add days from previous month
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

type Event = {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'meeting' | 'phase';
  opportunityId?: string;
  opportunityTitle?: string;
};

function MonthView({ date, events }: { date: Date; events: Event[] }) {
  const days = getDaysInMonth(date);
  const today = new Date();

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px flex-1 bg-slate-700">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, date);

          return (
            <div
              key={i}
              className={cn(
                'bg-slate-800 p-2 min-h-[100px] relative',
                !isCurrentMonth && 'opacity-40'
              )}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-2',
                  isToday
                    ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                    : 'text-slate-300'
                )}
              >
                {day.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate',
                      event.type === 'deadline' && 'bg-red-600/20 text-red-300 border border-red-600/30',
                      event.type === 'meeting' && 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
                      event.type === 'phase' && 'bg-green-600/20 text-green-300 border border-green-600/30'
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-400 px-1.5">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ date, events }: { date: Date; events: Event[] }) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
  const today = new Date();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-8 gap-px mb-px">
        <div className="bg-slate-800 p-2"></div>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={cn(
                'text-center p-2 bg-slate-800',
                isToday && 'bg-blue-600/20'
              )}
            >
              <div className="text-xs text-slate-400">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  isToday
                    ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                    : 'text-slate-200'
                )}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 gap-px">
          {hours.map((hour) => (
            <>
              <div key={`time-${hour}`} className="bg-slate-800 p-2 text-xs text-slate-400 text-right pr-4">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day, i) => (
                <div
                  key={`${hour}-${i}`}
                  className="bg-slate-800 border-t border-slate-700 p-1 min-h-[60px] relative"
                >
                  {/* Events would be positioned here based on time */}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* All-day events */}
      <div className="mt-4 space-y-2">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          if (dayEvents.length === 0) return null;

          return (
            <div key={i}>
              <div className="text-sm font-medium text-slate-300 mb-1">
                {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-1 ml-4">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'text-sm px-3 py-1.5 rounded',
                      event.type === 'deadline' && 'bg-red-600/20 text-red-300 border border-red-600/30',
                      event.type === 'meeting' && 'bg-blue-600/20 text-blue-300 border border-blue-600/30',
                      event.type === 'phase' && 'bg-green-600/20 text-green-300 border border-green-600/30'
                    )}
                  >
                    {event.title}
                    {event.opportunityTitle && (
                      <div className="text-xs opacity-70 mt-0.5">{event.opportunityTitle}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ events }: { events: Event[] }) {
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const dateKey = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <div className="space-y-6 overflow-y-auto h-full">
      {Object.entries(groupedEvents).length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Events</h3>
          <p className="text-slate-400">No events scheduled for this period.</p>
        </div>
      ) : (
        Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 sticky top-0 bg-slate-900 py-2">
              {date}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    event.type === 'deadline' && 'bg-red-600/10 border-red-600/30',
                    event.type === 'meeting' && 'bg-blue-600/10 border-blue-600/30',
                    event.type === 'phase' && 'bg-green-600/10 border-green-600/30'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            event.type === 'deadline' && 'bg-red-600/20 text-red-300',
                            event.type === 'meeting' && 'bg-blue-600/20 text-blue-300',
                            event.type === 'phase' && 'bg-green-600/20 text-green-300'
                          )}
                        >
                          {event.type}
                        </span>
                      </div>
                      <h4 className="font-medium text-slate-100">{event.title}</h4>
                      {event.opportunityTitle && (
                        <p className="text-sm text-slate-400 mt-1">{event.opportunityTitle}</p>
                      )}
                    </div>
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function DeadlinesList() {
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  const { data: deadlines, isLoading } = api.calendar.getEvents.useQuery({
    start: today,
    end: twoWeeksLater,
    type: 'deadline',
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const sortedDeadlines = (deadlines || []).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedDeadlines.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDeadlines.map((deadline) => {
        const daysUntil = Math.ceil(
          (new Date(deadline.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isUrgent = daysUntil <= 3;
        const isWarning = daysUntil > 3 && daysUntil <= 7;

        return (
          <div
            key={deadline.id}
            className={cn(
              'p-3 rounded-lg border',
              isUrgent && 'bg-red-600/10 border-red-600/30',
              isWarning && 'bg-yellow-600/10 border-yellow-600/30',
              !isUrgent && !isWarning && 'bg-slate-800 border-slate-700'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-slate-100 text-sm">{deadline.title}</h4>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isUrgent && 'bg-red-600/20 text-red-300',
                  isWarning && 'bg-yellow-600/20 text-yellow-300',
                  !isUrgent && !isWarning && 'bg-slate-700 text-slate-300'
                )}
              >
                {daysUntil}d
              </span>
            </div>
            {deadline.opportunityTitle && (
              <p className="text-xs text-slate-400 mb-2">{deadline.opportunityTitle}</p>
            )}
            <div className="text-xs text-slate-500">
              {new Date(deadline.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'agenda'>('month');

  const { data: events } = api.calendar.getEvents.useQuery({
    start: view === 'month' ? startOfMonth(currentDate) : startOfWeek(currentDate),
    end: view === 'month' ? endOfMonth(currentDate) : endOfWeek(currentDate),
  });

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (view === 'month') {
        newDate.setMonth(prev.getMonth() + direction);
      } else {
        newDate.setDate(prev.getDate() + (direction * 7));
      }
      return newDate;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          {/* View toggles */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {['Month', 'Week', 'Agenda'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase() as any)}
                className={cn(
                  'px-3 py-1.5 rounded text-sm transition-colors',
                  view === v.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-slate-100 min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          >
            Today
          </button>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          {view === 'month' && <MonthView date={currentDate} events={events || []} />}
          {view === 'week' && <WeekView date={currentDate} events={events || []} />}
          {view === 'agenda' && <AgendaView events={events || []} />}
        </div>

        {/* Sidebar - Upcoming Deadlines */}
        <div className="w-80 border-l border-slate-700 p-4 overflow-y-auto">
          <h3 className="font-semibold text-slate-100 mb-4">Upcoming Deadlines (Next 14 Days)</h3>
          <DeadlinesList />
        </div>
      </div>
    </div>
  );
}
