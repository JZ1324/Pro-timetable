import React from 'react';
import TimeSlot from '../TimeSlot';

const TimetableGrid = ({
  periods,
  currentDay,
  currentEditingSlot,
  filterSlots,
  getPeriodLabelRef,
  editingRowRef,
  onUpdateSlot,
  getConflictingSlot,
  onRemoveSlot,
  onStartEditing,
  onCancelEditing,
  displaySettings,
  currentPeriod,
  currentSchoolDay,
  editMode,
  hasPracticeReminder,
  onTogglePracticeReminder,
  onAddEmptySlot,
  periodSchedule
}) => {
  return (
    <div className="timetable">
      <div className="periods-column">
        {periods.map((period) => {
          const slotsForPeriod = filterSlots(currentDay, period);
          const isEditingThisPeriod = slotsForPeriod.some(
            (slot) => currentEditingSlot === (slot.id || `${slot.day}-${slot.period}`)
          );
          const schedule = periodSchedule[period];

          return (
            <div
              key={period}
              className={`period-label ${isEditingThisPeriod ? 'editing' : ''}`}
              data-period={period}
              ref={getPeriodLabelRef(period)}
            >
              <span>{period}</span>
              {schedule && <span className="time">{schedule.label}</span>}
            </div>
          );
        })}
      </div>

      <div className="day-column">
        {periods.map((period) => {
          const slotsForPeriod = filterSlots(currentDay, period);
          const isEditingThisPeriod = slotsForPeriod.some(
            (slot) => currentEditingSlot === (slot.id || `${slot.day}-${slot.period}`)
          );

          return (
            <div
              key={period}
              className={`period-row ${isEditingThisPeriod ? 'has-editing-slot' : ''}`}
              data-period={period}
              ref={isEditingThisPeriod ? editingRowRef : null}
            >
              {slotsForPeriod.map((slot) => (
                <TimeSlot
                  key={slot.id || `${slot.day}-${slot.period}`}
                  slot={slot}
                  onUpdate={onUpdateSlot}
                  getConflictingSlot={getConflictingSlot}
                  onRemove={onRemoveSlot}
                  isEditing={currentEditingSlot === (slot.id || `${slot.day}-${slot.period}`)}
                  onStartEditing={onStartEditing}
                  onCancelEditing={onCancelEditing}
                  displaySettings={displaySettings}
                  isCurrentPeriod={
                    currentPeriod !== null &&
                    slot.day === currentSchoolDay &&
                    String(slot.period) === String(currentPeriod)
                  }
                  editMode={editMode}
                  hasPracticeReminder={hasPracticeReminder(slot.day, slot.period)}
                  onTogglePracticeReminder={() => onTogglePracticeReminder(slot.day, slot.period, slot)}
                />
              ))}

              {editMode && slotsForPeriod.length === 0 && (
                <div className="add-time-slot">
                  <button onClick={() => onAddEmptySlot(period)}>
                    + Add Class
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimetableGrid;
