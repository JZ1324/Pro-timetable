import React from 'react';
import { getCurrentSchoolDay } from '../../utils/dateUtils';

const TimetableDaySelector = ({ days, currentDay, getDayName, onDayChange }) => {
  const todaySchoolDay = getCurrentSchoolDay();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  const getTodayText = () => {
    if (isSaturday) return '2 days';
    if (isSunday) return '1 day';
    return 'Today';
  };

  return (
    <div className="day-selector">
      {days.map((day) => {
        const isToday = day === todaySchoolDay;
        const hoverText = isToday ? getTodayText() : null;
        const titleText = isToday ? `${getDayName(day)} (${hoverText})` : getDayName(day);

        return (
          <button
            key={day}
            type="button"
            className={`day-button ${currentDay === day ? 'active' : ''} ${isToday ? 'current-day' : ''}`}
            onClick={(event) => onDayChange(event, day)}
            title={titleText}
          >
            <span>Day {day}</span>
            {isToday && <span className="today-text">{hoverText}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default TimetableDaySelector;
