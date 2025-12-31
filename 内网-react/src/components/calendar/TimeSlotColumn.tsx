import { useMemo, useEffect, useState } from 'react';
import { TIME_SLOTS } from './types';

interface TimeSlotColumnProps {
  showCurrentTime?: boolean;
}

export default function TimeSlotColumn({ showCurrentTime = true }: TimeSlotColumnProps) {
  const [currentMinuteOffset, setCurrentMinuteOffset] = useState(0);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Update current time every minute
  useEffect(() => {
    if (!showCurrentTime) return;

    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentMinuteOffset(now.getMinutes());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [showCurrentTime]);

  // Calculate position of current time indicator
  const currentTimePosition = useMemo(() => {
    if (!showCurrentTime) return null;
    if (currentHour < 9 || currentHour >= 17) return null;

    // Each hour slot is 72px (adjust based on your row height)
    const hourIndex = currentHour - 9;
    const minuteOffset = (currentMinuteOffset / 60) * 72;
    return hourIndex * 72 + minuteOffset;
  }, [showCurrentTime, currentHour, currentMinuteOffset]);

  return (
    <div className="time-slot-column">
      {TIME_SLOTS.map((slot, index) => (
        <div key={slot.hour} className="time-slot-label">
          <span className="time-text">{slot.label}</span>
          {index < TIME_SLOTS.length - 1 && (
            <span className="time-half">:30</span>
          )}
        </div>
      ))}

      {/* Current time indicator */}
      {currentTimePosition !== null && (
        <div
          className="current-time-indicator"
          style={{ top: `${currentTimePosition}px` }}
        >
          <div className="time-dot"></div>
          <div className="time-line"></div>
          <span className="time-label">
            {new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
    </div>
  );
}

// Individual time slot row for grid layout
interface TimeSlotRowProps {
  hour: number;
  label: string;
  children?: React.ReactNode;
  isCurrentHour?: boolean;
}

export function TimeSlotRow({ hour, label, children, isCurrentHour = false }: TimeSlotRowProps) {
  return (
    <div className={`time-slot-row ${isCurrentHour ? 'is-current' : ''}`}>
      <div className="time-label-cell">
        <span className="hour-label">{label}</span>
      </div>
      <div className="slot-content">{children}</div>
    </div>
  );
}
