import React, { useEffect, useRef, useState } from 'react';
import { getCurrentSchoolDay } from '../../utils/dateUtils';

const TimetableDaySelector = ({ days, currentDay, getDayName, onDayChange }) => {
  const selectorRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
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

  useEffect(() => {
    const updateIndicator = () => {
      const selector = selectorRef.current;
      const activeButton = selector?.querySelector(`[data-day="${currentDay}"]`);
      if (!selector || !activeButton) return;

      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth
      });
    };

    updateIndicator();
    const resizeObserver = window.ResizeObserver && selectorRef.current
      ? new ResizeObserver(updateIndicator)
      : null;

    if (resizeObserver) {
      resizeObserver.observe(selectorRef.current);
    }

    window.addEventListener('resize', updateIndicator);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      resizeObserver?.disconnect();
    };
  }, [currentDay, days]);

  return (
    <div className="day-selector" ref={selectorRef}>
      <span
        className="day-active-indicator"
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`
        }}
        aria-hidden="true"
      />
      {days.map((day) => {
        const isToday = day === todaySchoolDay;
        const hoverText = isToday ? getTodayText() : null;
        const titleText = isToday ? `${getDayName(day)} (${hoverText})` : getDayName(day);

        return (
          <button
            key={day}
            type="button"
            data-day={day}
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
