import React, { useState, useEffect, useRef } from 'react';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import colorService from '../services/colorService';
import { debugLog } from '../utils/debug';

const TimeSlot = ({ 
    slot, 
    onUpdate, 
    onRemove, 
    displaySettings, 
    isEditing, 
    onStartEditing, 
    onCancelEditing, 
    isCurrentPeriod, 
    editMode, 
    hasPracticeReminder, 
    onTogglePracticeReminder 
}) => {
    const [editedSlot, setEditedSlot] = useState({ ...slot });
    const timeSlotRef = useRef(null);
    useRevealOnScroll(timeSlotRef, { rootMargin: '0px 0px -15% 0px', threshold: 0.05 });
    
    // Update edited slot when the original slot changes
    useEffect(() => {
        debugLog('Slot changed, updating editedSlot:', slot);
        setEditedSlot({ ...slot });
    }, [slot]);

    // Scroll into view when editing starts
    useEffect(() => {
        if (isEditing && timeSlotRef.current) {
            // Small delay to ensure the expanded form is rendered before scrolling
            setTimeout(() => {
                timeSlotRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 50);
        }
    }, [isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedSlot({ ...editedSlot, [name]: value });
    };

    const saveChanges = () => {
        // Create a complete copy of the edited slot with all required properties
        const updatedSlot = { 
            ...slot,         // Preserve original properties like day and period
            ...editedSlot,   // Add edited values
            id: slot.id      // Ensure ID is preserved
        };
        
        // Make sure day and period are preserved from the original slot
        if (slot.day) updatedSlot.day = slot.day;
        if (slot.period) updatedSlot.period = slot.period;
        
        // Provide visual feedback that we're saving
        const saveButton = document.querySelector('.form-actions .save-button');
        if (saveButton) {
            saveButton.textContent = 'Saving...';
            saveButton.style.opacity = '0.7';
        }
        
        // Small delay to show the saving state
        setTimeout(() => {
            onUpdate(slot.id || `${slot.day}-${slot.period}`, updatedSlot);
        }, 150);
    };

    const cancelEdit = () => {
        setEditedSlot({ ...slot });
        
        // Provide visual feedback that we're canceling
        const cancelButton = document.querySelector('.form-actions .cancel-button');
        if (cancelButton) {
            cancelButton.textContent = 'Canceling...';
            cancelButton.style.opacity = '0.7';
        }
        
        // Small delay to show the canceling state
        setTimeout(() => {
            onCancelEditing();
        }, 150);
    };

    // Determine class color based on subject
    const getSubjectColor = () => {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || 
                          document.body.classList.contains('theme-dark');
        
        // Common predefined colors for frequently used subjects
        const lightSubjectColors = {
            'Mathematics - Advanced': '#4a90e2',  // Blue
            'Specialist Mathematics': '#5c6bc0',  // Indigo
            'Physics': '#43a047',                 // Green
            'Chemistry': '#26a69a',               // Teal
            'Biology Units 1 & 2': '#66bb6a',     // Light Green
            'English': '#ec407a',                 // Pink
            'Literature': '#e91e63',              // Deeper Pink
            'Psychology': '#9c27b0',              // Purple
            'War Boom and Bust': '#ff7043',       // Deep Orange
            'Active and Able': '#ffca28',         // Amber
            'Tutorial': '#bdbdbd',                // Grey
            'Private Study': '#9575cd',           // Deep Purple
            'PST': '#9575cd',                     // Deep Purple (same as Private Study)
            'Recess': '#8d6e63',                  // Brown
            'Lunch': '#fb8c00'                    // Orange
        };
        
        // Darker variants for dark mode (for better contrast)
        const darkSubjectColors = {
            'Mathematics - Advanced': '#2c5b9e',  // Darker blue
            'Specialist Mathematics': '#3f4d8c',  // Darker indigo
            'Physics': '#2d6e30',                 // Darker green
            'Chemistry': '#00796b',               // Darker teal
            'Biology Units 1 & 2': '#3d703f',     // Darker light green
            'English': '#aa2c57',                 // Darker pink
            'Literature': '#ad1457',              // Darker deep pink
            'Psychology': '#6a1b7a',              // Darker purple
            'War Boom and Bust': '#c8502b',       // Darker orange
            'Active and Able': '#c19412',         // Darker amber
            'Tutorial': '#757575',                // Darker grey
            'Private Study': '#673ab7',           // Darker deep purple
            'PST': '#673ab7',                     // Darker deep purple (same as Private Study)
            'Recess': '#5d4037',                  // Darker brown
            'Lunch': '#e65100'                    // Darker orange
        };
        
        // Enhanced hash function to generate a color based on subject name
        // This ensures consistent colors for the same subject with better visual distinction
        const stringToColor = (str) => {
            if (!str) return isDarkMode ? '#5c5c5c' : '#9e9e9e'; // Default gray for empty subjects
            
            // Generate a base hash from the string
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            
            // Define color palettes for better visual distinction
            // These are base HSL values that we'll modify
            const colorPalettes = [
                { h: 0, s: 75, l: 60 },     // Red family
                { h: 30, s: 75, l: 60 },    // Orange family
                { h: 60, s: 75, l: 60 },    // Yellow family
                { h: 120, s: 60, l: 40 },   // Green family
                { h: 180, s: 65, l: 45 },   // Teal family
                { h: 210, s: 70, l: 55 },   // Blue family
                { h: 240, s: 70, l: 60 },   // Indigo family
                { h: 270, s: 70, l: 55 },   // Purple family
                { h: 300, s: 70, l: 60 },   // Pink family
                { h: 330, s: 70, l: 60 }    // Magenta family
            ];
            
            // Select a base palette using the hash
            const paletteIndex = Math.abs(hash) % colorPalettes.length;
            const baseColor = colorPalettes[paletteIndex];
            
            // Adjust the hue within the palette range (+/- 15 degrees)
            const hueAdjust = ((hash >> 8) & 0xFF) % 30 - 15;
            let h = (baseColor.h + hueAdjust) % 360;
            if (h < 0) h += 360;
            
            // Adjust saturation slightly based on hash
            const satAdjust = ((hash >> 16) & 0xFF) % 20 - 10;
            let s = Math.max(50, Math.min(90, baseColor.s + satAdjust));
            
            // Adjust lightness based on theme and hash
            let l = baseColor.l;
            if (isDarkMode) {
                // Darker colors for dark mode, but ensure they're still visible
                l = Math.max(25, Math.min(50, l - 15 + ((hash >> 24) & 0xFF) % 10));
            } else {
                // Brighter colors for light mode
                l = Math.max(40, Math.min(65, l + ((hash >> 24) & 0xFF) % 10));
            }
            
            // Convert HSL to RGB
            const toRGB = (h, s, l) => {
                s /= 100;
                l /= 100;
                const k = n => (n + h / 30) % 12;
                const a = s * Math.min(l, 1 - l);
                const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
                return [
                    Math.round(255 * f(0)),
                    Math.round(255 * f(8)),
                    Math.round(255 * f(4))
                ];
            };
            
            // Convert to hex
            const rgb = toRGB(h, s, l);
            return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
        };
        
        // Check for break periods first (make these consistent)
        if (slot.isBreakPeriod || ['Recess', 'Lunch', 'Break', 'Interval'].includes(slot.subject)) {
            const breakColors = isDarkMode ? darkSubjectColors : lightSubjectColors;
            if (slot.subject === 'Recess') return breakColors['Recess'];
            if (slot.subject === 'Lunch') return breakColors['Lunch'];
            return isDarkMode ? '#5d4037' : '#8d6e63'; // Default break color (brown)
        }
        
        // Check for Tutorial periods
        if (slot.period === 'Tutorial' || slot.subject === 'Tutorial') {
            const tutorialColors = isDarkMode ? darkSubjectColors : lightSubjectColors;
            return tutorialColors['Tutorial'];
        }
        
        // Lookup in our predefined color maps first
        const subjectColors = isDarkMode ? darkSubjectColors : lightSubjectColors;
        
        // Check for custom color from colorService first
        const customColor = colorService.getSubjectColor(slot.subject, isDarkMode);
        if (customColor) {
            return customColor;
        }
        
        // Then check our predefined colors
        if (slot.subject && subjectColors[slot.subject]) {
            return subjectColors[slot.subject];
        }
        
        // For any other subject, generate a color based on the subject name
        return stringToColor(slot.subject);
    };

    // Get teacher's display name based on settings
    const getTeacherDisplayName = () => {
        if (!slot.teacher) return '';
        
        if (displaySettings?.useFirstNameForTeachers) {
            // Extract first name (assuming format is "Mr/Mrs/Ms First Last")
            const parts = slot.teacher.split(' ');
            if (parts.length >= 2) {
                return parts[1]; // Return first name
            }
        }
        return slot.teacher;
    };

    // Get appropriate text color based on background
    const getTextColor = (backgroundColor) => {
        if (!backgroundColor || typeof backgroundColor !== 'string') {
            return '#111827';
        }

        const hex = backgroundColor.replace('#', '').trim();
        if (!/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex)) {
            return '#111827';
        }

        const normalizedHex = hex.length === 3
            ? hex.split('').map((char) => char + char).join('')
            : hex;

        const rgbValues = normalizedHex.match(/.{2}/g).map((value) => parseInt(value, 16) / 255);
        const [r, g, b] = rgbValues.map((value) => (
            value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        ));
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        return luminance > 0.45 ? '#111827' : '#ffffff';
    };

    // View mode
    if (!isEditing) {
        // Handle special case for PST (Private Study)
        let subjectName = slot.subject || 'Unnamed Class';
        if (subjectName.trim().toUpperCase() === 'PST') {
            subjectName = 'Private Study';
        }

        const subjectColor = getSubjectColor();
        const textColor = getTextColor(subjectColor);
        const buttonStyle = textColor === '#ffffff'
            ? {
                color: textColor,
                borderColor: 'rgba(255, 255, 255, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.12)'
            }
            : {
                color: textColor,
                borderColor: 'rgba(17, 24, 39, 0.28)',
                backgroundColor: 'rgba(255, 255, 255, 0.45)'
            };

        return (
            <div 
                className={`time-slot ${isCurrentPeriod ? 'current-period' : ''} ${hasPracticeReminder ? 'has-practice-reminder' : ''}`}
                style={{
                    backgroundColor: subjectColor,
                    color: textColor,
                    cursor: 'pointer'
                }}
                ref={timeSlotRef}
                data-subject={slot.subject}
                data-period={`Period ${slot.period}`}
                data-time={`${slot.startTime} - ${slot.endTime}`}
                onClick={(e) => {
                    if (!e.target.closest('.time-slot-actions')) {
                        onStartEditing(slot.id || `${slot.day}-${slot.period}`);
                    }
                }}
                title={isCurrentPeriod ? `Current class: ${subjectName}` : "Click to edit this class"}
            >
                <div className="time-slot-header">
                    <span className="time">{slot.startTime} - {slot.endTime}</span>
                    <div className="time-slot-actions">
                        {onTogglePracticeReminder && (
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onTogglePracticeReminder();
                                }} 
                                className={`practice-button ${hasPracticeReminder ? 'active' : ''}`}
                                type="button"
                                aria-label={hasPracticeReminder ? `Disable practice reminder for ${subjectName}` : `Enable practice reminder for ${subjectName}`}
                                title={hasPracticeReminder ? 'Practice reminder enabled - Click to disable' : 'Click to enable practice reminder'}
                                style={hasPracticeReminder ? undefined : buttonStyle}
                            >
                                Prac
                            </button>
                        )}
                        <button 
                            onClick={(e) => {
                                e.preventDefault(); 
                                e.stopPropagation();
                                onStartEditing(slot.id || `${slot.day}-${slot.period}`);
                            }} 
                            className="edit-button"
                            type="button"
                            aria-label={`Edit ${subjectName}`}
                            style={buttonStyle}
                        >
                            Edit
                        </button>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemove(slot.id || `${slot.day}-${slot.period}`);
                            }} 
                            className="delete-button"
                            type="button"
                            aria-label={`Delete ${subjectName}`}
                            style={buttonStyle}
                        >
                            ×
                        </button>
                    </div>
                </div>
                <h3 className="subject-title">{subjectName}</h3>
                {slot.subject !== 'Recess' && slot.subject !== 'Lunch' && displaySettings?.displayCode && slot.code && <p className="code">{slot.code}</p>}
                {slot.subject !== 'Recess' && slot.subject !== 'Lunch' && displaySettings?.displayRoom && slot.room && <p className="room">Room: {slot.room}</p>}
                {slot.subject !== 'Recess' && slot.subject !== 'Lunch' && displaySettings?.displayTeacher && slot.teacher && <p className="teacher">Teacher: {getTeacherDisplayName()}</p>}
            </div>
        );
    }

    // Edit mode
    return (
        <div className="time-slot editing" ref={timeSlotRef}>
            <div className="time-slot-edit-header">
                <h4>Edit Class</h4>
                <span className="edit-period-label">Period {slot.period} • {slot.startTime} - {slot.endTime}</span>
            </div>
            <div className="time-slot-edit-form">
                <div className="form-group">
                    <label htmlFor={`subject-${slot.id || `${slot.day}-${slot.period}`}`}>Subject: {editedSlot.subject?.trim().toUpperCase() === 'PST' && <span style={{fontSize: '0.8em', color: '#ff5e3a'}}>(PST will display as "Private Study")</span>}</label>
                    <input 
                        id={`subject-${slot.id || `${slot.day}-${slot.period}`}`}
                        type="text" 
                        name="subject" 
                        value={editedSlot.subject || ''} 
                        onChange={handleChange} 
                        placeholder="Enter subject name (use PST for Private Study)"
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label htmlFor={`code-${slot.id || `${slot.day}-${slot.period}`}`}>Code:</label>
                    <input 
                        id={`code-${slot.id || `${slot.day}-${slot.period}`}`}
                        type="text" 
                        name="code" 
                        value={editedSlot.code || ''} 
                        onChange={handleChange} 
                        placeholder="Enter class code"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor={`start-time-${slot.id || `${slot.day}-${slot.period}`}`}>Start Time:</label>
                    <input 
                        id={`start-time-${slot.id || `${slot.day}-${slot.period}`}`}
                        type="text" 
                        name="startTime" 
                        value={editedSlot.startTime || ''} 
                        onChange={handleChange} 
                        placeholder="e.g., 8:35am"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor={`end-time-${slot.id || `${slot.day}-${slot.period}`}`}>End Time:</label>
                    <input 
                        id={`end-time-${slot.id || `${slot.day}-${slot.period}`}`}
                        type="text" 
                        name="endTime" 
                        value={editedSlot.endTime || ''} 
                        onChange={handleChange} 
                        placeholder="e.g., 9:35am"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor={`room-${slot.id || `${slot.day}-${slot.period}`}`}>Room:</label>
                    <input 
                        id={`room-${slot.id || `${slot.day}-${slot.period}`}`}
                        type="text" 
                        name="room" 
                        value={editedSlot.room || ''} 
                        onChange={handleChange} 
                        placeholder="Enter room number"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor={`teacher-${slot.id || `${slot.day}-${slot.period}`}`}>Teacher:</label>
                    <input 
                        id={`teacher-${slot.id || `${slot.day}-${slot.period}`}`}
                        type="text" 
                        name="teacher" 
                        value={editedSlot.teacher || ''} 
                        onChange={handleChange} 
                        placeholder="e.g., Mr Smith"
                    />
                </div>
                <div className="form-actions">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveChanges();
                        }} 
                        className="save-button"
                        type="button"
                    >
                        Save
                    </button>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemove(slot.id || `${slot.day}-${slot.period}`);
                        }} 
                        className="delete-button"
                        type="button"
                    >
                        Delete
                    </button>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelEdit();
                        }} 
                        className="cancel-button"
                        type="button"
                    >
                        Edit Mode
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeSlot;
