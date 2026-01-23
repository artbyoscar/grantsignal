'use client';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'commitment' | 'meeting' | 'milestone';
  color: string;
  meta?: Record<string, any>;
}

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

export const MonthView = ({ date, events, onEventClick, onDateClick }: MonthViewProps) => {
  const days = getDaysInMonth(date);
  const startDay = getFirstDayOfMonth(date);

  const eventsByDate = events.reduce((acc, event) => {
    const key = event.date.toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {Array.from({ length: 42 }).map((_, index) => {
          const dayNumber = index - startDay + 1;
          const isCurrentMonth = dayNumber > 0 && dayNumber <= days;
          const cellDate = new Date(date.getFullYear(), date.getMonth(), dayNumber);
          const dayEvents = eventsByDate[cellDate.toDateString()] || [];
          const isToday = cellDate.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && onDateClick?.(cellDate)}
              className={`border-b border-r border-slate-700/50 p-1 min-h-[100px] cursor-pointer hover:bg-slate-800/50 ${
                !isCurrentMonth ? 'bg-slate-900/50 text-slate-600' : ''
              }`}
            >
              <div className={`text-sm p-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-slate-400'}`}>
                {isCurrentMonth ? dayNumber : ''}
              </div>

              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                    className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color + '30', color: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-500 px-1.5">
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
};

// Helper functions
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}
