import React from 'react';
import ImportButton from '../ImportButton';

const TimetableHeaderPanel = ({
  currentDayLabel,
  isAdminUser,
  onOpenAdminDashboard,
  onOpenAdminTerminal,
  currentTemplate,
  templates,
  onTemplateChange,
  onDeleteTemplate,
  onSaveTemplate,
  editMode,
  onToggleEditMode,
  onOpenColors,
  onImport
}) => {
  return (
    <div className="timetable-header">
      <div className="header-main">
        <h2>School Timetable</h2>
        {isAdminUser && (
          <div className="admin-controls header-admin">
            <button
              className="admin-button-header"
              onClick={onOpenAdminDashboard}
              title="Open Admin Dashboard"
            >
              🛠️
            </button>
            <button
              className="admin-button-header terminal"
              onClick={onOpenAdminTerminal}
              title="Open Admin Terminal"
            >
              💻
            </button>
          </div>
        )}
      </div>

      <div className="current-day-display">
        <span>{currentDayLabel}</span>
      </div>

      <div className="template-controls">
        <div className="default-timetable-dropdown-container">
          <select
            value={currentTemplate}
            onChange={(event) => onTemplateChange(event.target.value)}
            className="default-timetable-btn"
            aria-label="Choose a timetable template"
          >
            <option value="" disabled>Default Timetable</option>
            {templates.map((template) => (
              <option key={template} value={template}>
                {template.charAt(0).toUpperCase() + template.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {currentTemplate && currentTemplate !== 'school' && (
          <button className="delete-template-btn" onClick={() => onDeleteTemplate(currentTemplate)}>
            Delete
          </button>
        )}

        <div className="save-template">
          <button className="save-template-btn" onClick={onSaveTemplate}>
            Save Template
          </button>
        </div>

        <button className={`edit-mode-toggle ${editMode ? 'active' : ''}`} onClick={onToggleEditMode}>
          {editMode ? 'View Mode' : 'Edit Mode'}
        </button>

        <button className="color-legend-btn" onClick={onOpenColors}>
          Colours
        </button>

        <ImportButton onImport={onImport} />
      </div>

      {editMode && (
        <div className="edit-mode-hint">
          <p>
            Click directly on any class to edit its details, or use the
            {' '}
            <span className="edit-button-hint">Edit</span>
            {' '}
            button
          </p>
        </div>
      )}
    </div>
  );
};

export default TimetableHeaderPanel;
