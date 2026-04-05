import React, { useMemo, useCallback } from 'react';
import TaskCard from './TaskCard';
import AssignmentCard from './AssignmentCard';
import '../../styles/components/AcademicPlanner/day.css';
import { getPriorityColor, getStatusBadgeConfig } from './utils';
import { FixedSizeList as List } from 'react-window';

const DayView = ({
    currentDate,
    tasks,
    handleEditTask,
    handleDeleteTask,
    handleTaskStatusChange,
    handleOpenAddTaskModal,
    handleOpenAddAssignmentModal,
    enterFocusMode = () => {},
    shareTask = () => {},
    studyTimer = { taskId: null, startTime: null, isRunning: false },
    startStudyTimer = () => {},
    stopStudyTimer = () => {},
    handleTaskComplete = () => {},
    handleProgressUpdate = () => {},
    handleEditAssignment = () => {},
    handleDeleteAssignment = () => {},
    getTimerDisplay = () => '00:00',
    getEstimatedTimeCountdown = () => 'Unknown',
    generateAISuggestions = [],
    handleSuggestionAction = () => {},
    todayFocusQueue = [],
    assignmentWorkloadWarnings = []
}) => {
    // Configuration for how many days ahead to show tasks
    const UPCOMING_DAYS_RANGE = 3; // Show tasks up to 3 days in advance
    
    // Get current date normalized to start of day
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Helper function to get due date status with countdown
    const getDueDateStatus = (dueDate) => {
        const taskDate = new Date(dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { 
                text: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`, 
                class: 'bg-red-100 text-red-800',
                urgency: 'overdue',
                sortOrder: -Math.abs(diffDays) // Most overdue first
            };
        } else if (diffDays === 0) {
            return { 
                text: 'Due today', 
                class: 'bg-orange-100 text-orange-800',
                urgency: 'today',
                sortOrder: 0
            };
        } else if (diffDays === 1) {
            return { 
                text: 'Due tomorrow', 
                class: 'bg-yellow-100 text-yellow-800',
                urgency: 'tomorrow',
                sortOrder: 1
            };
        } else if (diffDays <= UPCOMING_DAYS_RANGE) {
            return { 
                text: `Due in ${diffDays} days`, 
                class: 'bg-blue-100 text-blue-800',
                urgency: 'upcoming',
                sortOrder: diffDays
            };
        }
        return null;
    };
    
    // Filter tasks for current date and upcoming tasks within range
    const upcomingItems = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate.getTime() - todayDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Include overdue tasks, today's tasks, and tasks within the upcoming range
        return diffDays <= UPCOMING_DAYS_RANGE;
    }).map(task => ({
        ...task,
        dueDateStatus: getDueDateStatus(task.dueDate)
    })).sort((a, b) => {
        // Sort by urgency (overdue first, then today, then upcoming)
        return a.dueDateStatus.sortOrder - b.dueDateStatus.sortOrder;
    });
    
    // Separate assignments from regular tasks
    const assignments = upcomingItems.filter(task => task.isAssignment);
    const regularTasks = upcomingItems.filter(task => !task.isAssignment);
    
    // Group tasks by due date status for better organization
    const groupTasksByStatus = (tasks) => {
        const groups = {
            overdue: tasks.filter(task => task.dueDateStatus.urgency === 'overdue'),
            today: tasks.filter(task => task.dueDateStatus.urgency === 'today'),
            tomorrow: tasks.filter(task => task.dueDateStatus.urgency === 'tomorrow'),
            upcoming: tasks.filter(task => task.dueDateStatus.urgency === 'upcoming')
        };
        return groups;
    };
    
    const regularTaskGroups = groupTasksByStatus(regularTasks);
    const assignmentGroups = groupTasksByStatus(assignments);

    // Flatten regular task groups preserving order for virtualization
    const orderedRegularTasks = useMemo(()=>[
        ...regularTaskGroups.overdue,
        ...regularTaskGroups.today,
        ...regularTaskGroups.tomorrow,
        ...regularTaskGroups.upcoming
    ], [regularTaskGroups.overdue, regularTaskGroups.today, regularTaskGroups.tomorrow, regularTaskGroups.upcoming]);

    const VIRTUAL_THRESHOLD = 30; // only virtualize if many tasks
    const useVirtual = orderedRegularTasks.length > VIRTUAL_THRESHOLD;

    const ROW_HEIGHT = 210; // approximate TaskCard height; adjust if needed

    const Row = useCallback(({ index, style }) => {
        const task = orderedRegularTasks[index];
        return (
            <div style={style}>
                <TaskCard 
                    key={task.id}
                    task={task}
                    handleEditTask={handleEditTask}
                    handleDeleteTask={handleDeleteTask}
                    enterFocusMode={enterFocusMode}
                    shareTask={shareTask}
                    studyTimer={studyTimer}
                    startStudyTimer={startStudyTimer}
                    stopStudyTimer={stopStudyTimer}
                    handleTaskComplete={handleTaskComplete}
                    handleProgressUpdate={handleProgressUpdate}
                    getTimerDisplay={getTimerDisplay}
                    getEstimatedTimeCountdown={getEstimatedTimeCountdown}
                />
            </div>
        );
    }, [orderedRegularTasks, handleEditTask, handleDeleteTask, enterFocusMode, shareTask, studyTimer, startStudyTimer, stopStudyTimer, handleTaskComplete, handleProgressUpdate, getTimerDisplay, getEstimatedTimeCountdown]);

    // If no upcoming items at all, show a friendly empty state
    if (upcomingItems.length === 0) {
        return (
            <div className="day-view">
                <div className="tasks-section">
                    <div className="no-tasks">
                        <i className="ri-sparkling-line" aria-hidden="true"></i>
                        <h3 style={{margin: '0 0 8px 0'}}>You're all caught up</h3>
                        <p style={{margin: 0, color: 'var(--color-text-subtle)'}}>Add your first task or assignment to get started.</p>
                        <div style={{display:'flex', gap: '8px', marginTop: '16px'}}>
                            <button className="add-btn" onClick={handleOpenAddTaskModal} aria-label="Add a new task">
                                <i className="ri-add-line"></i> New Task
                            </button>
                            <button className="add-btn" onClick={handleOpenAddAssignmentModal} aria-label="Add a new assignment" style={{background: 'var(--color-accent-hover)'}}>
                                <i className="ri-add-circle-line"></i> New Assignment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="day-view">
            <div className="view-content">
                {todayFocusQueue.length > 0 && (
                    <div className="focus-queue-strip">
                        <div className="focus-queue-header">
                            <h3 className="section-header">Today Focus Queue</h3>
                            <span className="task-count">{todayFocusQueue.length}</span>
                        </div>
                        <div className="focus-queue-items">
                            {todayFocusQueue.map((task, index) => (
                                <button
                                    key={task.id}
                                    className="focus-queue-item"
                                    onClick={() => handleSuggestionAction({ id: 'schedule-today', taskId: task.id })}
                                    title={`Start ${task.title}`}
                                >
                                    <span className="focus-queue-rank">#{index + 1}</span>
                                    <span className="focus-queue-title">{task.title}</span>
                                    <span className="focus-queue-meta">{task.remainingMinutes} min</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {assignmentWorkloadWarnings.length > 0 && (
                    <div className="workload-warnings">
                        <h3 className="section-header">Assignment Workload Warnings</h3>
                        <div className="workload-warning-list">
                            {assignmentWorkloadWarnings.map((warning) => (
                                <div key={warning.id} className={`workload-warning-card ${warning.level}`}>
                                    <div>
                                        <h4>{warning.title}</h4>
                                        <p>
                                            {warning.openSubtasks} open subtasks{warning.sameDayCluster > 1 ? `, ${warning.sameDayCluster} due on the same day` : ''}.
                                        </p>
                                    </div>
                                    <span>{warning.recommendation}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Assignments Section */}
                {assignments.length > 0 && (
                    <div className="assignments-section">
                        <div className="section-header-with-actions">
                            <div className="section-header-with-count">
                                <h3 className="section-header">Assignments & Deadlines</h3>
                                <span className="task-count">{assignments.length}</span>
                            </div>
                            <button 
                                className="add-btn"
                                onClick={handleOpenAddAssignmentModal}
                                title="Add new assignment"
                            >
                                <i className="ri-add-line"></i> New Assignment
                            </button>
                        </div>
                        
                        {/* Overdue Assignments */}
                        {assignmentGroups.overdue.length > 0 && (
                            <div className="assignment-group overdue-group">
                                <h4 className="group-header overdue">
                                    <i className="ri-error-warning-line"></i>
                                    Overdue ({assignmentGroups.overdue.length})
                                </h4>
                                <div className="assignments-list">
                                    {assignmentGroups.overdue.map(assignment => (
                                        <AssignmentCard 
                                            key={assignment.id}
                                            assignment={assignment}
                                            handleEditAssignment={handleEditAssignment}
                                            handleDeleteAssignment={handleDeleteAssignment}
                                            handleTaskComplete={handleTaskComplete}
                                            handleProgressUpdate={handleProgressUpdate}
                                            studyTimer={studyTimer}
                                            startStudyTimer={startStudyTimer}
                                            stopStudyTimer={stopStudyTimer}
                                            getTimerDisplay={getTimerDisplay}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Today's Assignments */}
                        {assignmentGroups.today.length > 0 && (
                            <div className="assignment-group today-group">
                                <h4 className="group-header today">
                                    <i className="ri-time-line"></i>
                                    Due Today ({assignmentGroups.today.length})
                                </h4>
                                <div className="assignments-list">
                                    {assignmentGroups.today.map(assignment => (
                                        <AssignmentCard 
                                            key={assignment.id}
                                            assignment={assignment}
                                            handleEditAssignment={handleEditAssignment}
                                            handleDeleteAssignment={handleDeleteAssignment}
                                            handleTaskComplete={handleTaskComplete}
                                            handleProgressUpdate={handleProgressUpdate}
                                            studyTimer={studyTimer}
                                            startStudyTimer={startStudyTimer}
                                            stopStudyTimer={stopStudyTimer}
                                            getTimerDisplay={getTimerDisplay}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Tomorrow's Assignments */}
                        {assignmentGroups.tomorrow.length > 0 && (
                            <div className="assignment-group tomorrow-group">
                                <h4 className="group-header tomorrow">
                                    <i className="ri-calendar-line"></i>
                                    Due Tomorrow ({assignmentGroups.tomorrow.length})
                                </h4>
                                <div className="assignments-list">
                                    {assignmentGroups.tomorrow.map(assignment => (
                                        <AssignmentCard 
                                            key={assignment.id}
                                            assignment={assignment}
                                            handleEditAssignment={handleEditAssignment}
                                            handleDeleteAssignment={handleDeleteAssignment}
                                            handleTaskComplete={handleTaskComplete}
                                            handleProgressUpdate={handleProgressUpdate}
                                            studyTimer={studyTimer}
                                            startStudyTimer={startStudyTimer}
                                            stopStudyTimer={stopStudyTimer}
                                            getTimerDisplay={getTimerDisplay}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Upcoming Assignments */}
                        {assignmentGroups.upcoming.length > 0 && (
                            <div className="assignment-group upcoming-group">
                                <h4 className="group-header upcoming">
                                    <i className="ri-calendar-2-line"></i>
                                    Upcoming ({assignmentGroups.upcoming.length})
                                </h4>
                                <div className="assignments-list">
                                    {assignmentGroups.upcoming.map(assignment => (
                                        <AssignmentCard 
                                            key={assignment.id}
                                            assignment={assignment}
                                            handleEditAssignment={handleEditAssignment}
                                            handleDeleteAssignment={handleDeleteAssignment}
                                            handleTaskComplete={handleTaskComplete}
                                            handleProgressUpdate={handleProgressUpdate}
                                            studyTimer={studyTimer}
                                            startStudyTimer={startStudyTimer}
                                            stopStudyTimer={stopStudyTimer}
                                            getTimerDisplay={getTimerDisplay}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular Tasks Section (virtualized if large) */}
                <div className="tasks-section">
                    <div className="section-header-with-actions">
                        <div className="section-header-with-count">
                            <h3 className="section-header">Tasks</h3>
                            <span className="task-count">{orderedRegularTasks.length}</span>
                        </div>
                        <button 
                            className="add-btn"
                            onClick={handleOpenAddTaskModal}
                            title="Add new task"
                        >
                            <i className="ri-add-line"></i> New Task
                        </button>
                    </div>
                    {!useVirtual && (
                        <div className="tasks-list non-virtual">
                            {orderedRegularTasks.map(task => (
                                <TaskCard 
                                    key={task.id}
                                    task={task}
                                    handleEditTask={handleEditTask}
                                    handleDeleteTask={handleDeleteTask}
                                    enterFocusMode={enterFocusMode}
                                    shareTask={shareTask}
                                    studyTimer={studyTimer}
                                    startStudyTimer={startStudyTimer}
                                    stopStudyTimer={stopStudyTimer}
                                    handleTaskComplete={handleTaskComplete}
                                    handleProgressUpdate={handleProgressUpdate}
                                    getTimerDisplay={getTimerDisplay}
                                    getEstimatedTimeCountdown={getEstimatedTimeCountdown}
                                />
                            ))}
                        </div>
                    )}
                    {useVirtual && (
                        <List 
                            height={Math.min(window.innerHeight - 300, 800)}
                            itemCount={orderedRegularTasks.length}
                            itemSize={ROW_HEIGHT}
                            width={'100%'}
                            className="tasks-virtual-list"
                        >
                            {Row}
                        </List>
                    )}
                </div>

                <div className="ai-suggestions">
                    <h3 className="section-header">AI Study Suggestions</h3>
                    <div className="suggestions-list">
                        {generateAISuggestions.map(suggestion => (
                            <div key={suggestion.id} className={`suggestion-card ${suggestion.type}`}>
                                <div className="suggestion-icon">
                                    <i className={suggestion.icon}></i>
                                </div>
                                <div className="suggestion-content">
                                    <h4>{suggestion.title}</h4>
                                    <p className="suggestion-desc">{suggestion.description}</p>
                                    <button 
                                        className="suggestion-btn"
                                        onClick={() => handleSuggestionAction(suggestion)}
                                    >
                                        {suggestion.action}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {generateAISuggestions.length === 0 && (
                            <div className="no-suggestions">
                                <i className="ri-lightbulb-line"></i>
                                <p>Great job! No urgent suggestions at the moment. Keep up the good work!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayView;