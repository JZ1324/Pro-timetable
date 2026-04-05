import React, { useState, useEffect } from 'react';
import '../../styles/components/AcademicPlanner/sidebar.css';

const Sidebar = ({ 
    tasks, 
    filters = {}, // Add default value 
    handleFilterChange, 
    handleOpenAddTaskModal,
    handleOpenAddAssignmentModal
}) => {
    // Ensure filters has all required properties with defaults
    const safeFilters = {
        hideCompleted: false,
        showOnlyUpcoming: false,
        showOnlyOverdue: false,
        subjects: [],
        types: [],
        priorities: [],
        ...filters // Override defaults with actual values
    };

    // State for collapsible sections - only FILTERS is collapsible now
    const [collapsedSections, setCollapsedSections] = useState({
        filters: true
    });

    // Toggle function for sections
    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Load saved subjects from localStorage
    const loadSavedItems = (key, defaultItems) => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? [...defaultItems, ...JSON.parse(saved)] : defaultItems;
        } catch {
            return defaultItems;
        }
    };

    // Default subjects changed to Math and English as requested
    const defaultSubjects = ['Math', 'English'];
    const [subjects, setSubjects] = useState(() => loadSavedItems('customSubjects', defaultSubjects));

    // Update subjects when localStorage changes (when new subjects are added via forms)
    useEffect(() => {
        const handleStorageChange = () => {
            setSubjects(loadSavedItems('customSubjects', defaultSubjects));
        };

        // Listen for storage changes
        window.addEventListener('storage', handleStorageChange);
        
        // Also check for changes periodically since storage events don't fire for same-origin changes
        const interval = setInterval(handleStorageChange, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);
    return (
        <div className="academic-planner-sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">Academic Planner</h2>
            </div>
            <div className="sidebar-content">
                <div className="add-task-section">
                    <div className="add-buttons-row">
                        <button className="add-task-btn half-width" onClick={handleOpenAddTaskModal}>
                            <i className="ri-add-line"></i>
                            Task
                        </button>
                        <button className="add-assignment-btn half-width" onClick={handleOpenAddAssignmentModal}>
                            <i className="ri-add-line"></i>
                            Assignment
                        </button>
                    </div>
                </div>

                <div className="filters-section">
                    <button 
                        className="section-title-button" 
                        onClick={() => toggleSection('filters')}
                    >
                        <h3 className="section-title">FILTERS</h3>
                        <i className={`ri-arrow-down-s-line section-arrow ${collapsedSections.filters ? '' : 'rotate-180'}`}></i>
                    </button>
                    <div className={`section-content ${collapsedSections.filters ? 'collapsed' : 'expanded'}`}>
                        <div className="filter-group">
                            <label className="custom-switch">
                                <input 
                                    type="checkbox" 
                                    checked={safeFilters.hideCompleted}
                                    onChange={() => handleFilterChange('hideCompleted')}
                                />
                                <span className="switch-slider"></span>
                            </label>
                            <span className="filter-label">Hide completed tasks</span>
                        </div>
                        <div className="filter-group">
                            <label className="custom-switch">
                                <input 
                                    type="checkbox" 
                                    checked={safeFilters.showOnlyUpcoming}
                                    onChange={() => handleFilterChange('showOnlyUpcoming')}
                                />
                                <span className="switch-slider"></span>
                            </label>
                            <span className="filter-label">Show only upcoming</span>
                        </div>
                        <div className="filter-group">
                            <label className="custom-switch">
                                <input 
                                    type="checkbox" 
                                    checked={safeFilters.showOnlyOverdue}
                                    onChange={() => handleFilterChange('showOnlyOverdue')}
                                />
                                <span className="switch-slider"></span>
                            </label>
                            <span className="filter-label">Show only overdue</span>
                        </div>
                    </div>
                </div>

                <div className="subjects-section">
                    <button 
                        className="section-title-button" 
                        onClick={() => toggleSection('subjects')}
                    >
                        <h3 className="section-title">SUBJECTS</h3>
                        <i className={`ri-arrow-down-s-line section-arrow ${collapsedSections.subjects ? '' : 'rotate-180'}`}></i>
                    </button>
                    <div className={`section-content ${collapsedSections.subjects ? 'collapsed' : 'expanded'}`}>
                        <div className="checkbox-group">
                            {subjects.map(subject => (
                                <div key={subject} className="checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        className="custom-checkbox"
                                        id={`subject-${subject.toLowerCase().replace(/\s+/g, '-')}`}
                                        checked={filters.subjects.includes(subject)}
                                        onChange={() => handleFilterChange('subjects', subject)}
                                    />
                                    <label htmlFor={`subject-${subject.toLowerCase().replace(/\s+/g, '-')}`} className="checkbox-label">
                                        {subject}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="task-types-section">
                    <button 
                        className="section-title-button" 
                        onClick={() => toggleSection('taskTypes')}
                    >
                        <h3 className="section-title">TASK TYPES</h3>
                        <i className={`ri-arrow-down-s-line section-arrow ${collapsedSections.taskTypes ? '' : 'rotate-180'}`}></i>
                    </button>
                    <div className={`section-content ${collapsedSections.taskTypes ? 'collapsed' : 'expanded'}`}>
                        <div className="checkbox-group">
                            {['Assignment', 'Exam', 'Study Block', 'Event', 'Reminder'].map(type => (
                                <div key={type} className="checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        className="custom-checkbox"
                                        id={`type-${type.toLowerCase()}`}
                                        checked={filters.types.includes(type)}
                                        onChange={() => handleFilterChange('types', type)}
                                    />
                                    <label htmlFor={`type-${type.toLowerCase()}`} className="checkbox-label">
                                        {type}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="priority-section">
                    <button 
                        className="section-title-button" 
                        onClick={() => toggleSection('priority')}
                    >
                        <h3 className="section-title">PRIORITY</h3>
                        <i className={`ri-arrow-down-s-line section-arrow ${collapsedSections.priority ? '' : 'rotate-180'}`}></i>
                    </button>
                    <div className={`section-content ${collapsedSections.priority ? 'collapsed' : 'expanded'}`}>
                        <div className="checkbox-group">
                            {['High', 'Medium', 'Low'].map(priority => (
                                <div key={priority} className="checkbox-item">
                                    <input 
                                        type="checkbox" 
                                        className="custom-checkbox"
                                        id={`priority-${priority.toLowerCase()}`}
                                        checked={filters.priorities.includes(priority)}
                                        onChange={() => handleFilterChange('priorities', priority)}
                                    />
                                    <label htmlFor={`priority-${priority.toLowerCase()}`} className="checkbox-label priority-label">
                                        <span className={`priority-dot priority-${priority.toLowerCase()}`}></span>
                                        {priority}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="upcoming-deadlines">
                    <h3 className="section-title">Upcoming Deadlines</h3>
                    <div className="deadlines-list">
                        {(() => {
                            // Get upcoming tasks with proper date handling
                            const getUpcomingTasks = () => {
                                const now = new Date();
                                // Set to start of today for consistent comparison
                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                
                                return tasks.filter(task => {
                                    // Skip tasks without due dates or completed tasks
                                    if (!task.dueDate || task.status === 'completed') return false;
                                    
                                    const dueDate = new Date(task.dueDate);
                                    const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                    
                                    // Calculate days difference properly
                                    const timeDiff = taskDate.getTime() - today.getTime();
                                    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    
                                    // Include overdue tasks (negative days) and tasks up to 7 days ahead
                                    return daysDiff >= -7 && daysDiff <= 7;
                                })
                                .sort((a, b) => {
                                    // Sort by due date first, then by priority
                                    const dateCompare = new Date(a.dueDate) - new Date(b.dueDate);
                                    if (dateCompare !== 0) return dateCompare;
                                    
                                    // Priority order: High > Medium > Low
                                    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                                    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
                                })
                                .slice(0, 8); // Show more items for better overview
                            };

                            const upcomingTasks = getUpcomingTasks();

                            return upcomingTasks.length > 0 ? upcomingTasks.map(task => {
                                const now = new Date();
                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const dueDate = new Date(task.dueDate);
                                const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                
                                const timeDiff = taskDate.getTime() - today.getTime();
                                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                
                                // Generate date label with urgency context
                                let dateLabel, urgencyClass = '';
                                
                                if (daysDiff < 0) {
                                    const overdueDays = Math.abs(daysDiff);
                                    dateLabel = `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
                                    urgencyClass = 'overdue';
                                } else if (daysDiff === 0) {
                                    // Check if it's due today and what time
                                    const timeStr = dueDate.toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit', 
                                        hour12: true 
                                    });
                                    dateLabel = `Today ${timeStr}`;
                                    urgencyClass = 'today';
                                } else if (daysDiff === 1) {
                                    const timeStr = dueDate.toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit', 
                                        hour12: true 
                                    });
                                    dateLabel = `Tomorrow ${timeStr}`;
                                    urgencyClass = 'tomorrow';
                                } else if (daysDiff <= 3) {
                                    dateLabel = dueDate.toLocaleDateString('en-US', { 
                                        weekday: 'short',
                                        month: 'short', 
                                        day: 'numeric' 
                                    });
                                    urgencyClass = 'soon';
                                } else {
                                    dateLabel = dueDate.toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                    });
                                    urgencyClass = 'upcoming';
                                }

                                // Get priority color
                                const getPriorityColor = (priority) => {
                                    switch (priority) {
                                        case 'High': return '#ef4444';
                                        case 'Medium': return '#f59e0b';
                                        case 'Low': return '#10b981';
                                        default: return '#6b7280';
                                    }
                                };

                                return (
                                    <div 
                                        key={task.id} 
                                        className={`deadline-item ${urgencyClass} priority-${task.priority?.toLowerCase() || 'medium'}`}
                                        onClick={() => {
                                            // Scroll to task if it's visible, or show a notification
                                            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
                                            if (taskElement) {
                                                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                taskElement.classList.add('highlight-task');
                                                setTimeout(() => taskElement.classList.remove('highlight-task'), 2000);
                                            }
                                        }}
                                        title={`Click to view ${task.title} - ${task.description || 'No description'}`}
                                    >
                                        <div className="deadline-task-info">
                                            <div className="deadline-header">
                                                <span className="deadline-title">{task.title}</span>
                                                <div 
                                                    className="deadline-priority-dot" 
                                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                    title={`${task.priority || 'Medium'} priority`}
                                                ></div>
                                            </div>
                                            <div className="deadline-meta">
                                                <span className="deadline-subject">{task.subject}</span>
                                                {task.type && (
                                                    <>
                                                        <span className="deadline-separator">•</span>
                                                        <span className="deadline-type">{task.type}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="deadline-date-container">
                                            <span className={`deadline-date ${urgencyClass}`}>
                                                {dateLabel}
                                            </span>
                                            {urgencyClass === 'overdue' && (
                                                <i className="ri-error-warning-line deadline-warning-icon" title="Overdue!"></i>
                                            )}
                                            {urgencyClass === 'today' && (
                                                <i className="ri-time-line deadline-warning-icon" title="Due today!"></i>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="no-deadlines">
                                    <i className="ri-calendar-check-line"></i>
                                    <span>No upcoming deadlines</span>
                                    <small>Tasks due within the next 7 days will appear here</small>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;