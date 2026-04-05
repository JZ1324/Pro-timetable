import React, { useState, useEffect } from 'react';
import colorService from '../services/colorService';
import timetableService from '../services/timetableService';
import { notifyColorChanged } from '../utils/colorEvents';
import '../styles/components/ColorsWindow.css';

/**
 * Standalone colors customization window component
 * This renders in a separate browser window
 */
const ColorsWindow = () => {
    const [subjects, setSubjects] = useState([]);
    const [customColors, setCustomColors] = useState({});
    const [availableColors, setAvailableColors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize the colors window
        const initializeWindow = () => {
            try {
                // Get timetable data
                const timeSlots = timetableService.getTimeSlots();
                const uniqueSubjects = {};
                
                // Extract subjects from timetable
                timeSlots.forEach(slot => {
                    if (slot.subject && 
                        !['Recess', 'Lunch', 'Break', 'Interval', 'Tutorial'].includes(slot.subject)) {
                        uniqueSubjects[slot.subject] = true;
                    }
                });
                
                const sortedSubjects = Object.keys(uniqueSubjects).sort();
                setSubjects(sortedSubjects);
                
                // Load custom colors
                setCustomColors(colorService.getAllCustomColors());
                
                // Load available colors
                setAvailableColors(colorService.getAvailableColors());
                
                setLoading(false);
            } catch (error) {
                console.error('Error initializing colors window:', error);
                setLoading(false);
            }
        };

        initializeWindow();
    }, []);

    const updateSubjectColor = (subject, colorData) => {
        if (colorData === null) {
            // Remove custom color
            colorService.removeCustomColor(subject);
            const updatedColors = { ...customColors };
            delete updatedColors[subject];
            setCustomColors(updatedColors);
        } else {
            // Set custom color
            colorService.setCustomColor(subject, colorData);
            setCustomColors(prev => ({
                ...prev,
                [subject]: colorData
            }));
        }
        
        // Notify the main window of color changes
        notifyColorChanged();
        
        // Also post message to parent window if available
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({
                    type: 'COLOR_UPDATED',
                    subject: subject,
                    color: colorData
                }, '*');
            } catch (e) {
                console.log('Could not notify parent window');
            }
        }
    };

    const autoAssignColors = () => {
        subjects.forEach((subject, index) => {
            if (index < availableColors.length) {
                const color = availableColors[index];
                updateSubjectColor(subject, color);
            }
        });
    };

    const resetAllColors = () => {
        if (window.confirm('Are you sure you want to reset all custom colors?')) {
            subjects.forEach(subject => {
                updateSubjectColor(subject, null);
            });
        }
    };

    const getSubjectColor = (subject) => {
        const customColor = customColors[subject];
        if (customColor) {
            const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                            document.body.classList.contains('theme-dark');
            return isDarkMode ? customColor.darkValue : customColor.value;
        }
        
        // Return default color calculation
        let hash = 0;
        for (let i = 0; i < subject.length; i++) {
            hash = subject.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % availableColors.length;
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                        document.body.classList.contains('theme-dark');
        return availableColors[colorIndex] ? 
               (isDarkMode ? availableColors[colorIndex].darkValue : availableColors[colorIndex].value) : 
               '#4285f4';
    };

    const getTextColor = (backgroundColor) => {
        // Simple contrast calculation
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    };

    if (loading) {
        return (
            <div className="colors-window-container">
                <div className="colors-window-header">
                    <h1>Customize Subject Colours</h1>
                    <button onClick={() => window.close()} className="close-window-btn">
                        Close Window
                    </button>
                </div>
                <div className="colors-window-body">
                    <div className="loading-message">
                        <p>Loading your timetable data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="colors-window-container">
            <div className="colors-window-header">
                <h1>Customize Subject Colours</h1>
                <button onClick={() => window.close()} className="close-window-btn">
                    Close Window
                </button>
            </div>
            
            <div className="colors-window-body">
                {subjects.length === 0 ? (
                    <div className="no-subjects-message">
                        <p>No subjects found in your timetable.</p>
                    </div>
                ) : (
                    <>
                        <p className="help-text">
                            Customize the colours of your subjects. Each subject must have a unique colour.
                        </p>
                        
                        <div className="color-palette-preview">
                            <h3>Available Colours</h3>
                            <div className="color-palette-grid">
                                {availableColors.map(color => {
                                    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                                                    document.body.classList.contains('theme-dark');
                                    const colorValue = isDarkMode ? color.darkValue : color.value;
                                    const isUsed = Object.values(customColors).some(c => 
                                        (isDarkMode ? c.darkValue : c.value) === colorValue);
                                    
                                    return (
                                        <div 
                                            key={color.value}
                                            className={`palette-color-item ${isUsed ? 'used' : ''}`}
                                            style={{ backgroundColor: colorValue }}
                                            title={`${color.name}${isUsed ? ' (Used)' : ''}`}
                                        >
                                            {isUsed && <span className="used-indicator">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="action-buttons">
                            <button onClick={autoAssignColors} className="auto-assign-btn">
                                Auto-Assign Colours
                            </button>
                            <button onClick={resetAllColors} className="reset-all-btn">
                                Reset All Colours
                            </button>
                        </div>
                        
                        <div className="subject-color-grid">
                            {subjects.map(subject => {
                                const currentColor = customColors[subject];
                                const colorValue = getSubjectColor(subject);
                                
                                return (
                                    <div key={subject} className="subject-color-item">
                                        <div className="subject-info">
                                            <h4 className="subject-name">{subject}</h4>
                                            <div 
                                                className="subject-color-sample"
                                                style={{ 
                                                    backgroundColor: colorValue,
                                                    color: getTextColor(colorValue)
                                                }}
                                            >
                                                {currentColor ? currentColor.name : 'Default'}
                                            </div>
                                        </div>
                                        
                                        <div className="color-controls">
                                            <select 
                                                className="color-dropdown"
                                                value={currentColor ? currentColor.value : ''}
                                                aria-label={`Select colour for ${subject}`}
                                                onChange={(e) => {
                                                    if (e.target.value === '') {
                                                        updateSubjectColor(subject, null);
                                                    } else {
                                                        const selectedColor = availableColors.find(c => c.value === e.target.value);
                                                        if (selectedColor) {
                                                            updateSubjectColor(subject, selectedColor);
                                                        }
                                                    }
                                                }}
                                            >
                                                <option value="">Default Color</option>
                                                {availableColors.map(color => (
                                                    <option 
                                                        key={color.value} 
                                                        value={color.value}
                                                    >
                                                        {color.name}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {currentColor && (
                                                <button 
                                                    className="reset-color-btn"
                                                    onClick={() => updateSubjectColor(subject, null)}
                                                    title="Reset to default color"
                                                >
                                                    ↺
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="color-summary">
                            <h3>Colour Summary</h3>
                            <div className="color-preview-grid">
                                {subjects.map(subject => {
                                    const colorValue = getSubjectColor(subject);
                                    const customColor = customColors[subject];
                                    
                                    return (
                                        <div 
                                            key={subject}
                                            className="color-preview-item"
                                            style={{ 
                                                backgroundColor: colorValue,
                                                color: getTextColor(colorValue)
                                            }}
                                            title={`${subject}${customColor ? ' (Custom)' : ' (Default)'}`}
                                        >
                                            <span className="preview-subject-name">{subject}</span>
                                            <span className="preview-color-status">
                                                {customColor ? '●' : '○'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ColorsWindow;
