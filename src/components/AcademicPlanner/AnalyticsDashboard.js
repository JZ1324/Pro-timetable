import React, { useState, useEffect } from 'react';
import '../../styles/components/AcademicPlanner/AnalyticsDashboard.css';

const AnalyticsDashboard = ({ tasks, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'subjects', 'productivity'
    const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'semester', 'all'
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        bySubject: {},
        byType: {},
        overdue: 0,
        completionRate: 0,
        avgCompletionTime: 0
    });

    // Calculate stats whenever tasks or timeRange changes
    useEffect(() => {
        calculateStats();
    }, [tasks, timeRange]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        // Disable body scroll
        document.body.style.overflow = 'hidden';
        
        // Re-enable body scroll on cleanup
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const calculateStats = () => {
        // Ensure tasks is an array
        if (!Array.isArray(tasks)) {
            console.warn('Tasks is not an array:', tasks);
            setStats({
                total: 0,
                completed: 0,
                inProgress: 0,
                notStarted: 0,
                byPriority: { high: 0, medium: 0, low: 0 },
                bySubject: {},
                byType: {},
                overdue: 0,
                completionRate: 0,
                avgCompletionTime: 0
            });
            return;
        }

        // Filter tasks based on time range
        const filteredTasks = filterTasksByTimeRange(tasks);
        
        // Initial stats
        let total = filteredTasks.length;
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        let overdue = 0;
        let completionTimeSum = 0;
        let completedCount = 0;
        
        // Counters for categories
        let byPriority = { high: 0, medium: 0, low: 0 };
        let bySubject = {};
        let byType = {};
        
        // Current date for overdue calculation
        const now = new Date();
        
        filteredTasks.forEach(task => {
            // Ensure task has required properties with defaults
            const taskStatus = task.status || 'not-started';
            const taskPriority = (task.priority || 'medium').toLowerCase();
            const taskSubject = task.subject || 'Uncategorized';
            const taskType = task.type || 'Task';
            const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
            
            // Count by status
            if (taskStatus === 'completed') {
                completed++;
                
                // Calculate completion time if data available
                if (task.completedAt && task.createdAt) {
                    const completionTime = new Date(task.completedAt) - new Date(task.createdAt);
                    completionTimeSum += completionTime;
                    completedCount++;
                }
            } else if (taskStatus === 'in-progress') {
                inProgress++;
            } else {
                notStarted++;
            }
            
            // Check if overdue
            if (taskStatus !== 'completed' && taskDueDate && taskDueDate < now) {
                overdue++;
            }
            
            // Count by priority
            if (byPriority[taskPriority] !== undefined) {
                byPriority[taskPriority]++;
            } else {
                byPriority[taskPriority] = 1;
            }
            
            // Count by subject
            if (!bySubject[taskSubject]) {
                bySubject[taskSubject] = 0;
            }
            bySubject[taskSubject]++;
            
            // Count by type
            if (!byType[taskType]) {
                byType[taskType] = 0;
            }
            byType[taskType]++;
        });
        
        // Calculate completion rate and average completion time
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        const avgCompletionTime = completedCount > 0 ? completionTimeSum / completedCount : 0;
        
        // Update stats state
        setStats({
            total,
            completed,
            inProgress,
            notStarted,
            byPriority,
            bySubject,
            byType,
            overdue,
            completionRate,
            avgCompletionTime
        });
    };

    const filterTasksByTimeRange = (tasks) => {
        if (!Array.isArray(tasks)) {
            return [];
        }
        
        const now = new Date();
        
        switch (timeRange) {
            case 'week': {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return tasks.filter(task => {
                    const createdAt = task.createdAt ? new Date(task.createdAt) : null;
                    return createdAt && createdAt >= weekAgo;
                });
            }
            case 'month': {
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return tasks.filter(task => {
                    const createdAt = task.createdAt ? new Date(task.createdAt) : null;
                    return createdAt && createdAt >= monthAgo;
                });
            }
            case 'semester': {
                const sixMonthsAgo = new Date(now);
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return tasks.filter(task => {
                    const createdAt = task.createdAt ? new Date(task.createdAt) : null;
                    return createdAt && createdAt >= sixMonthsAgo;
                });
            }
            case 'all':
            default:
                return tasks;
        }
    };

    // Format time (for avg completion time)
    const formatTime = (milliseconds) => {
        if (!milliseconds) return 'N/A';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
    };

    // Sort object entries by value in descending order
    const getSortedEntries = (obj) => {
        return Object.entries(obj)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5
    };

    // Get percentage for visualization
    const getPercentage = (value, total) => {
        return total > 0 ? (value / total) * 100 : 0;
    };

    // Get color based on priority
    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    return (
        <div className="analytics-overlay">
            <div className="analytics-modal">
                <div className="analytics-header">
                    <h3>Analytics Dashboard</h3>
                    <button className="analytics-close-btn" onClick={onClose}>
                        <i className="ri-close-line"></i>
                    </button>
                </div>
                
                <div className="analytics-controls">
                    <div className="analytics-tabs">
                        <button 
                            className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button 
                            className={`analytics-tab ${activeTab === 'subjects' ? 'active' : ''}`}
                            onClick={() => setActiveTab('subjects')}
                        >
                            Subjects
                        </button>
                        <button 
                            className={`analytics-tab ${activeTab === 'productivity' ? 'active' : ''}`}
                            onClick={() => setActiveTab('productivity')}
                        >
                            Productivity
                        </button>
                    </div>
                    
                    <div className="time-range-selector">
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="time-range-select"
                            aria-label="Select analytics time range"
                        >
                            <option value="week">Past Week</option>
                            <option value="month">Past Month</option>
                            <option value="semester">Past 6 Months</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
                
                <div className="analytics-content">
                    {activeTab === 'overview' && (
                        <div className="analytics-overview">
                            <div className="stat-cards">
                                <div className="stat-card">
                                    <div className="stat-icon total">
                                        <i className="ri-list-check"></i>
                                    </div>
                                    <div className="stat-details">
                                        <h4>Total Tasks</h4>
                                        <p className="stat-value">{stats.total}</p>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon completed">
                                        <i className="ri-check-line"></i>
                                    </div>
                                    <div className="stat-details">
                                        <h4>Completed</h4>
                                        <p className="stat-value">{stats.completed}</p>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon in-progress">
                                        <i className="ri-time-line"></i>
                                    </div>
                                    <div className="stat-details">
                                        <h4>In Progress</h4>
                                        <p className="stat-value">{stats.inProgress}</p>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon not-started">
                                        <i className="ri-calendar-todo-line"></i>
                                    </div>
                                    <div className="stat-details">
                                        <h4>Not Started</h4>
                                        <p className="stat-value">{stats.notStarted}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="analytics-row">
                                <div className="analytics-col">
                                    <div className="analytics-card">
                                        <h4 className="analytics-card-title">Task Status</h4>
                                        {stats.total === 0 ? (
                                            <div className="empty-state">
                                                <div className="empty-state-icon">
                                                    <i className="ri-task-line"></i>
                                                </div>
                                                <p className="empty-state-message">No tasks yet</p>
                                                <p className="empty-state-subtitle">Create your first task to see analytics</p>
                                            </div>
                                        ) : (
                                            <div className="progress-container">
                                                <div className="progress-ring-container">
                                                    <div className="progress-ring">
                                                        <div className="completion-rate">
                                                            <span className="percentage">{Math.round(stats.completionRate) || 0}%</span>
                                                            <span className="label">Completion Rate</span>
                                                        </div>
                                                        <svg viewBox="0 0 120 120" className="ring-svg">
                                                            {/* Background circle */}
                                                            <circle
                                                                cx="60"
                                                                cy="60"
                                                                r="50"
                                                                fill="none"
                                                                stroke="#e5e7eb"
                                                                strokeWidth="10"
                                                            />
                                                            {/* Progress circle */}
                                                            <circle
                                                                cx="60"
                                                                cy="60"
                                                                r="50"
                                                                fill="none"
                                                                stroke="#4f46e5"
                                                                strokeWidth="10"
                                                                strokeDasharray={`${Math.max(0, (stats.completionRate || 0) / 100 * 314.16)} 314.16`}
                                                                strokeDashoffset="0"
                                                                style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="status-legend">
                                                    <div className="legend-item">
                                                        <span className="legend-color completed"></span>
                                                        <span className="legend-label">Completed</span>
                                                        <span className="legend-value">{stats.completed}</span>
                                                    </div>
                                                    <div className="legend-item">
                                                        <span className="legend-color in-progress"></span>
                                                        <span className="legend-label">In Progress</span>
                                                        <span className="legend-value">{stats.inProgress}</span>
                                                    </div>
                                                    <div className="legend-item">
                                                        <span className="legend-color not-started"></span>
                                                        <span className="legend-label">Not Started</span>
                                                        <span className="legend-value">{stats.notStarted}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="analytics-col">
                                    <div className="analytics-card">
                                        <h4 className="analytics-card-title">Task Priority</h4>
                                        <div className="bar-chart-container">
                                            <div className="bar-chart">
                                                {Object.entries(stats.byPriority).map(([priority, count]) => (
                                                    <div className="bar-item" key={priority}>
                                                        <div className="bar-label">{priority.charAt(0).toUpperCase() + priority.slice(1)}</div>
                                                        <div className="bar-track">
                                                            <div 
                                                                className="bar-fill"
                                                                style={{
                                                                    width: `${getPercentage(count, stats.total)}%`,
                                                                    backgroundColor: getPriorityColor(priority)
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="bar-value">{count}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="analytics-card">
                                <h4 className="analytics-card-title">Performance Metrics</h4>
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <div className="metric-icon overdue">
                                            <i className="ri-error-warning-line"></i>
                                        </div>
                                        <div className="metric-details">
                                            <h5>Overdue Tasks</h5>
                                            <p className="metric-value">{stats.overdue}</p>
                                        </div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-icon completion-time">
                                            <i className="ri-timer-line"></i>
                                        </div>
                                        <div className="metric-details">
                                            <h5>Avg. Completion Time</h5>
                                            <p className="metric-value">{formatTime(stats.avgCompletionTime)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'subjects' && (
                        <div className="analytics-subjects">
                            <div className="analytics-row">
                                <div className="analytics-col">
                                    <div className="analytics-card">
                                        <h4 className="analytics-card-title">Tasks by Subject</h4>
                                        <div className="subject-chart">
                                            {getSortedEntries(stats.bySubject).map(([subject, count], index) => (
                                                <div className="subject-item" key={subject}>
                                                    <div className="subject-info">
                                                        <span className="subject-name">{subject}</span>
                                                        <span className="subject-count">{count} tasks</span>
                                                    </div>
                                                    <div className="subject-bar-track">
                                                        <div 
                                                            className="subject-bar-fill"
                                                            style={{
                                                                width: `${getPercentage(count, stats.total)}%`,
                                                                backgroundColor: `hsl(${index * 40}, 70%, 60%)`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="analytics-col">
                                    <div className="analytics-card">
                                        <h4 className="analytics-card-title">Tasks by Type</h4>
                                        <div className="type-chart">
                                            {getSortedEntries(stats.byType).map(([type, count], index) => (
                                                <div className="type-item" key={type}>
                                                    <div className="type-info">
                                                        <span className="type-name">{type}</span>
                                                        <span className="type-count">{count} tasks</span>
                                                    </div>
                                                    <div className="type-bar-track">
                                                        <div 
                                                            className="type-bar-fill"
                                                            style={{
                                                                width: `${getPercentage(count, stats.total)}%`,
                                                                backgroundColor: `hsl(${180 + index * 40}, 70%, 60%)`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="analytics-card">
                                <h4 className="analytics-card-title">Subject Distribution</h4>
                                <div className="pie-chart-container">
                                    <div className="pie-chart">
                                        <svg viewBox="0 0 100 100" className="pie-svg">
                                            {Object.entries(stats.bySubject).map(([subject, count], index, array) => {
                                                const total = array.reduce((sum, [_, value]) => sum + value, 0);
                                                const percentage = (count / total) * 100;
                                                
                                                // Calculate previous slices total percentage for offset
                                                const previousTotal = array.slice(0, index).reduce((sum, [_, value]) => sum + value, 0);
                                                const previousPercentage = (previousTotal / total) * 100;
                                                
                                                // Convert percentages to circle measurements
                                                const dashArray = percentage * 2.51; // 2.51 approximates to the full circle circumference/100
                                                const dashOffset = -previousPercentage * 2.51;
                                                
                                                return (
                                                    <circle
                                                        key={subject}
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="none"
                                                        stroke={`hsl(${index * 40}, 70%, 60%)`}
                                                        strokeWidth="20"
                                                        strokeDasharray={`${dashArray} ${251 - dashArray}`}
                                                        strokeDashoffset={dashOffset}
                                                        transform="rotate(-90 50 50)"
                                                    />
                                                );
                                            })}
                                        </svg>
                                    </div>
                                    <div className="pie-legend">
                                        {Object.entries(stats.bySubject).map(([subject, count], index) => (
                                            <div className="legend-item" key={subject}>
                                                <span 
                                                    className="legend-color" 
                                                    style={{ backgroundColor: `hsl(${index * 40}, 70%, 60%)` }}
                                                ></span>
                                                <span className="legend-label">{subject}</span>
                                                <span className="legend-value">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'productivity' && (
                        <div className="analytics-productivity">
                            <div className="analytics-row">
                                <div className="analytics-col">
                                    <div className="analytics-card">
                                        <h4 className="analytics-card-title">Completion Rate</h4>
                                        <div className="completion-trend">
                                            <div className="trend-header">
                                                <div className="trend-percentage">
                                                    <span className="big-number">{Math.round(stats.completionRate)}%</span>
                                                    <span className="trend-label">Completion Rate</span>
                                                </div>
                                                <div className="trend-status">
                                                    {stats.completionRate >= 70 ? (
                                                        <div className="trend-badge good">
                                                            <i className="ri-arrow-up-line"></i>
                                                            Good
                                                        </div>
                                                    ) : stats.completionRate >= 40 ? (
                                                        <div className="trend-badge average">
                                                            <i className="ri-arrow-right-line"></i>
                                                            Average
                                                        </div>
                                                    ) : (
                                                        <div className="trend-badge poor">
                                                            <i className="ri-arrow-down-line"></i>
                                                            Needs Improvement
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="trend-progress">
                                                <div className="trend-bar-track">
                                                    <div 
                                                        className="trend-bar-fill"
                                                        style={{
                                                            width: `${stats.completionRate}%`,
                                                            backgroundColor: stats.completionRate >= 70 ? '#10b981' : 
                                                                           stats.completionRate >= 40 ? '#f59e0b' : '#ef4444'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="analytics-col">
                                    <div className="analytics-card">
                                        <h4 className="analytics-card-title">Task Distribution</h4>
                                        <div className="task-distribution">
                                            <div className="distribution-item">
                                                <div className="distribution-info">
                                                    <span className="distribution-label">High Priority</span>
                                                    <span className="distribution-value">{stats.byPriority.high}</span>
                                                </div>
                                                <div className="distribution-bar-track">
                                                    <div 
                                                        className="distribution-bar-fill high"
                                                        style={{ width: `${getPercentage(stats.byPriority.high, stats.total)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="distribution-item">
                                                <div className="distribution-info">
                                                    <span className="distribution-label">Medium Priority</span>
                                                    <span className="distribution-value">{stats.byPriority.medium}</span>
                                                </div>
                                                <div className="distribution-bar-track">
                                                    <div 
                                                        className="distribution-bar-fill medium"
                                                        style={{ width: `${getPercentage(stats.byPriority.medium, stats.total)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="distribution-item">
                                                <div className="distribution-info">
                                                    <span className="distribution-label">Low Priority</span>
                                                    <span className="distribution-value">{stats.byPriority.low}</span>
                                                </div>
                                                <div className="distribution-bar-track">
                                                    <div 
                                                        className="distribution-bar-fill low"
                                                        style={{ width: `${getPercentage(stats.byPriority.low, stats.total)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="analytics-card">
                                <h4 className="analytics-card-title">Efficiency Metrics</h4>
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <div className="metric-icon avg-time">
                                            <i className="ri-timer-line"></i>
                                        </div>
                                        <div className="metric-details">
                                            <h5>Avg. Completion Time</h5>
                                            <p className="metric-value">{formatTime(stats.avgCompletionTime)}</p>
                                        </div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-icon priority-ratio">
                                            <i className="ri-bar-chart-box-line"></i>
                                        </div>
                                        <div className="metric-details">
                                            <h5>High Priority Completion</h5>
                                            <p className="metric-value">
                                                {stats.byPriority.high > 0 ? 
                                                    `${Math.round((stats.completed / stats.byPriority.high) * 100)}%` : 
                                                    'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-icon overdue-rate">
                                            <i className="ri-error-warning-line"></i>
                                        </div>
                                        <div className="metric-details">
                                            <h5>Overdue Rate</h5>
                                            <p className="metric-value">
                                                {stats.total > 0 ? 
                                                    `${Math.round((stats.overdue / stats.total) * 100)}%` : 
                                                    '0%'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-icon efficiency">
                                            <i className="ri-line-chart-line"></i>
                                        </div>
                                        <div className="metric-details">
                                            <h5>Task Efficiency</h5>
                                            <p className="metric-value">
                                                {Math.round(((stats.completed * 2) + stats.inProgress) / 
                                                    (stats.total * 2) * 100)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
