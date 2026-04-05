import React, { useState, useEffect, useRef } from 'react';
import { animate as anime } from 'animejs';
import TimeSlot from './TimeSlot';
import ImportButton from './ImportButton';
import ImportTimetable from './ImportTimetable';
import TemplateNamePopup from './TemplateNamePopup';
import NotificationPopup from './NotificationPopup';
import ConfirmDialog from './ConfirmDialog';
import ColorsPopup from './ColorsPopup';
import PracticeReminderPopup from './PracticeReminderPopup';
import MobileDetector from './MobileDetector';
import timetableService from '../services/timetableService';
import { useSyncStatus } from '../hooks/useSyncStatus';
import FirestoreTimetableService from '../services/firestoreTimetableService';
import { TimetableManager } from '../services/timetableManager';
import { getFirestore } from 'firebase/firestore';
import parseTimetable from '../utils/timetableParser';
import convertStructuredDataToTimeSlots from '../utils/convertStructuredDataToTimeSlots';
import { getCurrentSchoolDay, getCurrentPeriod, shouldShowBreakPeriod } from '../utils/dateUtils';
import { saveCurrentTimetableDay, getLastActiveTimetableDay, saveCurrentTemplate, getLastActiveTemplate } from '../utils/userPreferences';
import { useAuth } from './AuthProvider';
import { isAdmin } from '../services/userService';
import AdminTerminal from './AdminTerminal';
import AdminDashboard from './AdminDashboard';
import { isNotificationSupported, requestNotificationPermission, checkUpcomingClasses } from '../services/notificationService';
import { debugLog } from '../utils/debug';
import '../styles/components/Timetable.css';
import '../styles/components/TimeSlot.css';
import '../styles/components/CurrentDay.css';
import '../styles/components/BreakPeriods.css';
import '../styles/components/DefaultButton.css';
import '../styles/components/TemplateNamePopup.css';
import '../styles/components/NotificationPopup.css';
import '../styles/components/ConfirmDialog.css';
import '../styles/components/ColorsPopup.css';
import '../styles/components/PracticeReminderPopup.css';

const Timetable = () => {
    const { user } = useAuth();
    const timetableRef = useRef(null);
    const dayButtonsRef = useRef([]);
    
    // Use shared sync status hook
    const { isFirestoreReady, firestoreService, timetableManager } = useSyncStatus();
    
    // Existing state variables
    const [timeSlots, setTimeSlots] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [currentTemplate, setCurrentTemplate] = useState('');
    const [currentDay, setCurrentDay] = useState(1);
    const [editMode, setEditMode] = useState(false);
    const [currentEditingSlot, setCurrentEditingSlot] = useState(null);
    const [currentPeriod, setCurrentPeriod] = useState('');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [showAdminTerminal, setShowAdminTerminal] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [templatePopup, setTemplatePopup] = useState({
        isOpen: false,
        suggestedName: '',
        onSave: null,
        successMessage: '',
        fallbackMessage: ''
    });
    const [notification, setNotification] = useState({
        isOpen: false,
        message: '',
        type: 'info', // 'info', 'success', 'error', 'warning'
        title: ''
    });
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning' // 'warning', 'danger', 'info'
    });
    const [displaySettings, setDisplaySettings] = useState({
        displayCode: true,
        displayTeacher: true,
        displayRoom: true,
        useFirstNameForTeachers: false
    });
    const [visiblePeriods, setVisiblePeriods] = useState({
        Recess: false,
        Lunch: false
    });
    const [showColorLegend, setShowColorLegend] = useState(false);
    const [editingRowHeight, setEditingRowHeight] = useState(null);
    const [practiceReminders, setPracticeReminders] = useState({});
    const [activePracticePopups, setActivePracticePopups] = useState([]);
    const [showPracticeReminderSettings, setShowPracticeReminderSettings] = useState(false);
    
    // Animation functions - Using CSS animations for better compatibility
    const animateTimeSlots = () => {
        try {
            const timeSlots = document.querySelectorAll('.time-slot');
            console.log(`Found ${timeSlots.length} time slots in DOM`);
            
            timeSlots.forEach((slot, i) => {
                // Simple CSS animation
                slot.style.opacity = '0';
                slot.style.transform = 'translateY(50px) scale(0.8)';
                slot.style.transition = 'all 0.8s ease';
                
                setTimeout(() => {
                    slot.style.opacity = '1';
                    slot.style.transform = 'translateY(0) scale(1)';
                }, i * 100);
            });
        } catch (error) {
            console.warn('Error in animateTimeSlots:', error);
        }
    };

    const animateDayChange = () => {
        try {
            const timeSlots = document.querySelectorAll('.time-slot');
            console.log(`Animating day change for ${timeSlots.length} time slots`);
            
            // First fade out
            timeSlots.forEach((slot) => {
                slot.style.opacity = '0';
                slot.style.transform = 'translateX(-30px)';
                slot.style.transition = 'all 0.2s ease-in';
            });
            
            // Then fade back in
            setTimeout(() => {
                timeSlots.forEach((slot, i) => {
                    setTimeout(() => {
                        slot.style.opacity = '1';
                        slot.style.transform = 'translateX(0)';
                        slot.style.transition = 'all 0.4s ease-out';
                    }, i * 50);
                });
            }, 200);
        } catch (error) {
            console.warn('Error in animateDayChange:', error);
        }
    };

    const animateCurrentPeriod = () => {
        try {
            const currentPeriodElements = document.querySelectorAll('.current-period');
            console.log(`Found ${currentPeriodElements.length} current period elements in DOM`);
            
            currentPeriodElements.forEach((element) => {
                // Enhanced CSS animation that complements existing styles
                element.style.transform = 'translateY(-8px) scale(1.08)';
                element.style.boxShadow = '0 12px 24px rgba(255, 94, 58, 0.4), 0 0 30px rgba(255, 149, 0, 0.6)';
                element.style.border = '2px solid rgba(255, 255, 255, 0.9)';
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.zIndex = '2000';
                
                // Add a subtle background enhancement without overriding text
                element.style.backgroundImage = 'linear-gradient(135deg, rgba(255, 94, 58, 0.2) 0%, rgba(255, 149, 0, 0.2) 100%)';
                
                setTimeout(() => {
                    element.style.transform = 'translateY(-3px) scale(1.02)';
                    element.style.boxShadow = '0 8px 16px rgba(255, 94, 58, 0.3), 0 0 20px rgba(255, 149, 0, 0.4)';
                    element.style.border = '1px solid rgba(255, 255, 255, 0.8)';
                    element.style.zIndex = '1000';
                    element.style.backgroundImage = 'linear-gradient(135deg, rgba(255, 94, 58, 0.08) 0%, rgba(255, 149, 0, 0.08) 100%)';
                }, 600);
            });
        } catch (error) {
            console.warn('Error in animateCurrentPeriod:', error);
        }
    };

    const animateAdminButton = () => {
        try {
            const adminButtons = document.querySelectorAll('.admin-button');
            console.log(`Found ${adminButtons.length} admin buttons in DOM`);
            
            adminButtons.forEach((button) => {
                // Simple CSS animation
                button.style.transform = 'scale(0) rotate(0deg)';
                button.style.opacity = '0';
                button.style.transition = 'all 0.8s ease';
                
                setTimeout(() => {
                    button.style.transform = 'scale(1) rotate(360deg)';
                    button.style.opacity = '1';
                }, 100);
                
                setTimeout(() => {
                    button.style.transform = 'scale(1) rotate(0deg)';
                }, 800);
            });
        } catch (error) {
            console.warn('Error in animateAdminButton:', error);
        }
    };
    
    // Add button hover animations
    const addButtonHoverAnimations = () => {
        try {
            const buttons = document.querySelectorAll('button');
            console.log(`Adding hover animations to ${buttons.length} buttons`);

            buttons.forEach(button => {
                const onEnter = () => {
                    try {
                        button.style.transform = 'scale(1.06)';
                        button.style.transition = 'transform 0.15s ease';
                    } catch (e) {
                        console.warn('Error in button hover animation:', e);
                    }
                };
                const onLeave = () => {
                    try {
                        button.style.transform = 'scale(1)';
                        button.style.transition = 'transform 0.15s ease';
                    } catch (e) {
                        console.warn('Error in button leave animation:', e);
                    }
                };
                button.addEventListener('mouseenter', onEnter);
                button.addEventListener('mouseleave', onLeave);
            });
        } catch (error) {
            console.warn('Error in addButtonHoverAnimations:', error);
        }
    };

    // Simple test animation helper to validate DOM manipulation
    const testAnimation = () => {
        try {
            const timeSlots = document.querySelectorAll('.time-slot');
            const duration = 1000;
            timeSlots.forEach((slot, i) => {
                slot.style.transition = 'transform 0.6s ease';
                setTimeout(() => {
                    slot.style.transform = 'scale(1.2) rotate(10deg)';
                    setTimeout(() => {
                        slot.style.transform = 'scale(1) rotate(0deg)';
                    }, duration);
                }, i * 150);
            });
            setTimeout(() => {
                console.log('Animation completed!');
            }, timeSlots.length * 150 + duration);
        } catch (error) {
            console.warn('Error in testAnimation:', error);
        }
    };

    // Simple test function without anime.js to check DOM elements
    const testDOMElements = () => {
        const timeSlots = document.querySelectorAll('.time-slot');
        console.log(`Found ${timeSlots.length} time slots in DOM`);
        
        timeSlots.forEach((slot, i) => {
            console.log(`Time slot ${i}:`, slot);
            // Simple CSS animation test
            slot.style.transform = 'scale(1.1) rotate(5deg)';
            slot.style.transition = 'transform 0.3s ease';
            slot.style.backgroundColor = '#ffeb3b';
            
            setTimeout(() => {
                slot.style.transform = 'scale(1) rotate(0deg)';
                slot.style.backgroundColor = '';
            }, 300);
        });
    };
    
    // Make both test functions available globally
    window.testAnimation = testAnimation;
    window.testDOMElements = testDOMElements;
    
    /**
     * Generate a template name for auto-saving imported timetables
     * @param {Array} slots - The time slots to extract subject names from
     * @returns {string} A generated template name
     */
    const generateImportTemplateName = (slots) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString().replace(/\//g, '-');
        
        // Find a few subjects to include in the template name (skip break periods)
        const subjectNames = [...new Set(
            slots
                .filter(slot => slot.subject && !['Lunch', 'Recess', 'Tutorial'].includes(slot.subject))
                .map(slot => slot.subject)
        )].slice(0, 2);
        
        // Create template name with subjects if available, otherwise just date
        if (subjectNames.length > 0) {
            return `Imported (${subjectNames.join(', ')}) ${dateStr}`;
        } else {
            return `Imported ${dateStr}`;
        }
    };
    
    /**
     * Automatically save the current timetable as a template with custom name prompt
     * @param {string} suggestedName - The suggested name to use for the template
     * @param {string} successMessage - The success message to show in the alert
     * @param {string} fallbackMessage - The fallback message if saving fails
     * @returns {boolean} Whether the save was successful
     */
    const saveAutoTemplate = (suggestedName, successMessage, fallbackMessage) => {
        // Open the template name popup with the suggested name
        setTemplatePopup({
            isOpen: true,
            suggestedName: suggestedName,
            successMessage,
            fallbackMessage,
            onSave: async (userTemplateName) => {
                try {
                    // If user provides a name, use it; otherwise use the suggested name
                    const templateName = userTemplateName ? userTemplateName.trim() : suggestedName;
                    
                    // If we still have no name, generate a timestamp-based one
                    const finalTemplateName = templateName || `Imported ${new Date().toISOString().slice(0, 10)}`;
                    
                    // Save the timetable as a template
                    if (isFirestoreReady && firestoreService) {
                        // Save to Firestore
                        await firestoreService.saveTemplate(finalTemplateName, timeSlots);
                        console.log('✅ Template saved to Firestore');
                    } else {
                        // Fallback to localStorage
                        timetableService.saveAsTemplate(finalTemplateName);
                        console.log('✅ Template saved to localStorage');
                    }
                    
                    // Update the templates list and current template
                    setTemplates(timetableService.getTemplateNames());
                    setCurrentTemplate(finalTemplateName);
                    saveCurrentTemplate(finalTemplateName);
                    
                    // Close the popup without showing any alert
                    setTemplatePopup(prev => ({ ...prev, isOpen: false }));
                    
                    return true;
                } catch (error) {
                    console.error('Error saving timetable as template:', error);
                    
                    // Close the popup without showing any alert
                    setTemplatePopup(prev => ({ ...prev, isOpen: false }));
                    
                    return false;
                }
            }
        });
        
        // Return true to indicate that the popup was shown
        return true;
    };
    const [notificationSettings, setNotificationSettings] = useState({
        enabled: false,
        permissionGranted: false,
        timeMinutes: 15
    });
    const editingRowRef = useRef(null);
    const labelRefs = useRef({});
    const notificationIntervalRef = useRef(null);

    // Get all days from 1 to 10
    const days = Array.from({ length: 10 }, (_, i) => i + 1);
    
    // Get day name based on day number
    const getDayName = (dayNum) => {
        const dayNames = {
            1: 'Monday (Week A)', 2: 'Tuesday (Week A)', 3: 'Wednesday (Week A)', 4: 'Thursday (Week A)', 5: 'Friday (Week A)',
            6: 'Monday (Week B)', 7: 'Tuesday (Week B)', 8: 'Wednesday (Week B)', 
            9: 'Thursday (Week B)', 10: 'Friday (Week B)'
        };
        return dayNames[dayNum] || `Day ${dayNum}`;
    };
    
    // Handle day selection with improved event handling
    const handleDayChange = (event, day) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log("Switching to day:", day);
        setCurrentDay(day);
        // Save the current day to localStorage
        saveCurrentTimetableDay(day);
        // Close any open editing form when switching days
        setCurrentEditingSlot(null);
        // Animate day change
        setTimeout(() => animateDayChange(), 50);
    };

    // Open colors customization popup
    const openColorsWindow = () => {
        setShowColorLegend(true);
    };

    useEffect(() => {
        // Load templates on component mount
        const templateNames = timetableService.getTemplateNames();
        setTemplates(templateNames);
        
        // Load the last active template from localStorage (defaults to 'school')
        const lastActiveTemplate = getLastActiveTemplate();
        if (templateNames.includes(lastActiveTemplate)) {
            loadTemplate(lastActiveTemplate);
        } else if (templateNames.includes('school')) {
            loadTemplate('school');
        }

        // Check if we're returning from mobile view
        const mobileState = localStorage.getItem('mobile-state');
        let dayToSet = getCurrentSchoolDay(); // Default to today
        
        if (mobileState) {
            try {
                const parsed = JSON.parse(mobileState);
                // Restore the day we were on in mobile view if it's recent (within 5 minutes)
                if (parsed.timestamp && (Date.now() - parsed.timestamp) < 5 * 60 * 1000) {
                    dayToSet = parsed.currentDay || dayToSet;
                    debugLog(`🔄 Restored from mobile: Day ${dayToSet}`);
                }
                // Clean up the mobile state
                localStorage.removeItem('mobile-state');
            } catch (error) {
                console.error('Error parsing mobile state:', error);
            }
        }

        // Set the current day (either today or restored from mobile)
        setCurrentDay(dayToSet);
        debugLog(`Setting current day to: Day ${dayToSet}`);
        
        // Save the current day selection
        saveCurrentTimetableDay(dayToSet);
        
        // Set current period based on current time
        const nowPeriod = getCurrentPeriod();
        setCurrentPeriod(nowPeriod);
        debugLog(`Current period is ${nowPeriod}`);
        
        // Check if break periods should be visible
        const showRecess = shouldShowBreakPeriod('Recess');
        const showLunch = shouldShowBreakPeriod('Lunch');
        setVisiblePeriods({
            Recess: showRecess,
            Lunch: showLunch
        });
        
        // Update current period and break visibility every minute
        const updateInterval = setInterval(() => {
            const updatedPeriod = getCurrentPeriod();
            debugLog(`Updating current period to: ${updatedPeriod}`);
            setCurrentPeriod(updatedPeriod);
            
            // Animate current period change
            if (updatedPeriod) {
                setTimeout(() => animateCurrentPeriod(), 100);
            }
            
            // Update break period visibility
            const updatedShowRecess = shouldShowBreakPeriod('Recess');
            const updatedShowLunch = shouldShowBreakPeriod('Lunch');
            setVisiblePeriods({
                Recess: updatedShowRecess,
                Lunch: updatedShowLunch
            });
        }, 30000); // check every 30 seconds for more responsive UI

        // Clean up on unmount
        return () => {
            clearInterval(updateInterval);
        };

        // Load display settings from localStorage
        const savedSettings = localStorage.getItem('timetable-settings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                setDisplaySettings({
                    displayCode: parsedSettings.displayCode !== undefined ? parsedSettings.displayCode : true,
                    displayTeacher: parsedSettings.displayTeacher !== undefined ? parsedSettings.displayTeacher : true,
                    displayRoom: parsedSettings.displayRoom !== undefined ? parsedSettings.displayRoom : true,
                    useFirstNameForTeachers: parsedSettings.useFirstNameForTeachers || false
                });
                
                // Load notification settings
                setNotificationSettings({
                    enabled: parsedSettings.enableNotifications || false,
                    permissionGranted: false, // Will be updated later
                    timeMinutes: parsedSettings.notificationTime || 15
                });
            } catch (error) {
                console.error('Error parsing settings:', error);
            }
        }
        
        // Add button hover animations
        setTimeout(() => addButtonHoverAnimations(), 1000);
    }, []);
    
    // Initialize notification system
    useEffect(() => {
        const initializeNotifications = async () => {
            // Check if notifications are supported
            if (!isNotificationSupported()) {
                debugLog('Browser notifications are not supported');
                return;
            }
            
            // Check if notifications are enabled in settings
            if (!notificationSettings.enabled) {
                debugLog('Notifications are disabled in settings');
                return;
            }
            
            // Request permission if needed
            const permissionGranted = await requestNotificationPermission();
            setNotificationSettings(prev => ({
                ...prev,
                permissionGranted
            }));
            
            if (!permissionGranted) {
                debugLog('Notification permission denied');
                return;
            }
            
            debugLog(`Notification system initialized with ${notificationSettings.timeMinutes} minute alert time`);
        };
        
        initializeNotifications();
    }, [notificationSettings.enabled]);
    
    // Set up notification checking interval
    useEffect(() => {
        // Clear any existing interval
        if (notificationIntervalRef.current) {
            clearInterval(notificationIntervalRef.current);
            notificationIntervalRef.current = null;
        }
        
        // If notifications are enabled and permission is granted, set up the interval
        if (notificationSettings.enabled && notificationSettings.permissionGranted) {
            // Check every minute for upcoming classes
            notificationIntervalRef.current = setInterval(() => {
                const todayDay = getCurrentSchoolDay();
                
                // Only check for notifications if we're viewing today's timetable
                if (todayDay === currentDay) {
                    const notificationResult = checkUpcomingClasses(
                        timeSlots,
                        notificationSettings.timeMinutes,
                        currentDay
                    );
                    
                    if (notificationResult && notificationResult.length > 0) {
                        notificationResult.forEach(result => {
                            debugLog('Notification sent for upcoming class:', result.slot.subject);
                        });
                    }
                }
            }, 60000); // Check every minute
            
            // Run an initial check
            const todayDay = getCurrentSchoolDay();
            if (todayDay === currentDay) {
                const notificationResult = checkUpcomingClasses(
                    timeSlots,
                    notificationSettings.timeMinutes,
                    currentDay
                );
                
                if (notificationResult && notificationResult.length > 0) {
                    notificationResult.forEach(result => {
                        debugLog('Initial notification sent for upcoming class:', result.slot.subject);
                    });
                }
            }
        }
        
        // Clean up on unmount
        return () => {
            if (notificationIntervalRef.current) {
                clearInterval(notificationIntervalRef.current);
                notificationIntervalRef.current = null;
            }
        };
    }, [
        notificationSettings.enabled, 
        notificationSettings.permissionGranted, 
        notificationSettings.timeMinutes,
        timeSlots,
        currentDay
    ]);
    
    /**
     * Handle importing timetable data and automatically save as template
     * @param {object|string} data - The timetable data to import, can be structured object or raw text
     */
    const importTimetable = (data) => {
        console.log('Importing timetable data:', data);
        if (!data) return;
        
        // Convert the imported data to time slots
        const convertedSlots = convertStructuredDataToTimeSlots(data);
        
        if (convertedSlots && convertedSlots.length > 0) {
            // Clear existing timetable first
            timetableService.clearTimetable();
            
            // Add each time slot to the service
            convertedSlots.forEach(slot => {
                timetableService.addTimeSlot(slot);
            });
            
            // Update the UI
            setTimeSlots(convertedSlots);
            
            // Make sure we have a current day that exists in the data
            // Get unique days from the imported data
            const importedDays = [...new Set(convertedSlots.map(slot => slot.day))];
            if (importedDays.length > 0) {
                const newDay = importedDays.includes(currentDay) ? currentDay : importedDays[0];
                setCurrentDay(newDay);
                saveCurrentTimetableDay(newDay);
            }
            
            // Automatically save the imported timetable as a template
            // Generate a meaningful template name using our utility function
            const importedTemplateName = generateImportTemplateName(convertedSlots);
            
            // Save the timetable as a template using our utility function
            saveAutoTemplate(
                importedTemplateName,
                `Timetable imported successfully and saved as template "${importedTemplateName}"`,
                'Timetable imported successfully!'
            )
        } else {
            setNotification({
                isOpen: true,
                message: 'Failed to import timetable. The data format may be incorrect.',
                type: 'error',
                title: 'Import Error'
            });
        }
    };

    // Check if user has admin privileges
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (user && user.uid) {
                try {
                    const adminStatus = await isAdmin(user.uid);
                    setIsAdminUser(adminStatus);
                    
                    // Animate admin button if user is admin
                    if (adminStatus) {
                        setTimeout(() => animateAdminButton(), 100);
                    }
                } catch (error) {
                    console.error('Error checking admin status:', error);
                    setIsAdminUser(false);
                }
            } else {
                setIsAdminUser(false);
            }
        };
        
        checkAdminStatus();
    }, [user]);

    useEffect(() => {
        if (currentEditingSlot && editingRowRef.current) {
            // Get the height of the row being edited
            const height = editingRowRef.current.clientHeight;
            setEditingRowHeight(height);
        } else {
            setEditingRowHeight(null);
        }
    }, [currentEditingSlot]);

    const loadTemplate = (templateName) => {
        timetableService.loadTemplate(templateName);
        setTimeSlots(timetableService.getTimeSlots());
        setCurrentTemplate(templateName);
        // Save the current template to localStorage
        saveCurrentTemplate(templateName);
        // Close any open editing form when loading a template
        setCurrentEditingSlot(null);
        
        // Animate time slots when template loads
        setTimeout(() => animateTimeSlots(), 100);
        
        // Load practice reminders for this template
        const storageKey = `practice-reminders-${templateName}`;
        const savedReminders = localStorage.getItem(storageKey);
        if (savedReminders) {
            try {
                setPracticeReminders(JSON.parse(savedReminders));
            } catch (error) {
                console.error('Error loading practice reminders for template:', error);
                setPracticeReminders({});
            }
        } else {
            // Clear reminders if no saved data for this template
            setPracticeReminders({});
        }
    };

    const deleteTemplate = (templateName) => {
        // Don't delete built-in templates
        if (templateName === 'school') {
            setNotification({
                isOpen: true,
                message: 'The default school template cannot be deleted.',
                type: 'warning',
                title: 'Cannot Delete Template'
            });
            return;
        }
        
        // Show confirm dialog for deletion
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Template',
            message: `Are you sure you want to delete the template "${templateName}"?`,
            type: 'danger',
            onConfirm: () => {
                // Close the confirm dialog
                setConfirmDialog(prev => ({...prev, isOpen: false}));
                
                const success = timetableService.deleteTemplate(templateName);
                if (success) {
                    // Update template list
                    setTemplates(timetableService.getTemplateNames());
                    
                    // If the deleted template was the current template, switch to the school template
                    if (currentTemplate === templateName) {
                        loadTemplate('school');
                    }
                    
                    // Show success notification
                    setNotification({
                        isOpen: true,
                        message: `Template "${templateName}" has been deleted.`,
                        type: 'success',
                        title: 'Template Deleted'
                    });
                }
            }
        });
    };

    /**
     * Check if the current timetable is effectively empty (only contains break periods)
     * @returns {boolean} True if timetable is empty (only break periods), false otherwise
     */
    const isTimetableEmpty = () => {
        // Filter out break periods (Recess, Lunch, Tutorial) and periods with no actual classes
        const nonBreakSlots = timeSlots.filter(slot => {
            const isBreakPeriod = slot.isBreakPeriod || 
                                  ['Recess', 'Lunch', 'Tutorial'].includes(slot.subject) ||
                                  !slot.subject || 
                                  slot.subject.trim() === '';
            return !isBreakPeriod;
        });
        
        return nonBreakSlots.length === 0;
    };

    /**
     * Generate a suggested name for empty timetables
     * @returns {string} Suggested template name
     */
    const generateEmptyTemplateName = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString().replace(/\//g, '-');
        return `Empty Template ${dateStr}`;
    };

    /**
     * Save the current timetable as a template using popup prompt
     */
    const saveTemplate = () => {
        // Check if the timetable is empty
        if (isTimetableEmpty()) {
            // Auto-prompt for name when timetable is empty
            const suggestedName = generateEmptyTemplateName();
            
            // Use the popup mechanism for empty timetables
            saveAutoTemplate(
                suggestedName,
                `Empty template saved successfully as "${suggestedName}"!`,
                'Empty template saved successfully!'
            );
            return;
        }
        
        // For non-empty timetables, generate a suggested name and use popup
        const suggestedName = generateImportTemplateName(timeSlots);
        
        saveAutoTemplate(
            suggestedName,
            `Template saved successfully!`,
            'Template saved successfully!'
        );
    };

    /**
     * Toggle practice reminder for a specific time slot
     * @param {number} day - The day number
     * @param {string} period - The period name
     * @param {object} slot - The time slot object
     */
    const togglePracticeReminder = (day, period, slot) => {
        const reminderKey = `${day}-${period}`;
        
        setPracticeReminders(prev => {
            const newReminders = { ...prev };
            
            if (newReminders[reminderKey]) {
                // Remove reminder
                delete newReminders[reminderKey];
            } else {
                // Add reminder
                newReminders[reminderKey] = {
                    day,
                    period,
                    subject: slot.subject || 'Practice',
                    time: slot.time || 'No time set',
                    room: slot.room || '',
                    teacher: slot.teacher || '',
                    enabled: true,
                    reminderDate: new Date(),
                    lastShown: null,
                    template: currentTemplate // Associate reminder with current template
                };
            }
            
            // Save to localStorage with template-specific key
            const storageKey = `practice-reminders-${currentTemplate}`;
            localStorage.setItem(storageKey, JSON.stringify(newReminders));
            return newReminders;
        });
    };

    /**
     * Check if a time slot has practice reminder enabled
     * @param {number} day - The day number
     * @param {string} period - The period name
     * @returns {boolean} Whether practice reminder is enabled
     */
    const hasPracticeReminder = (day, period) => {
        const reminderKey = `${day}-${period}`;
        return !!practiceReminders[reminderKey]?.enabled;
    };

    /**
     * Show practice reminder popup
     * @param {object} reminder - The reminder object
     */
    const showPracticePopup = (reminder) => {
        const popupId = `${reminder.day}-${reminder.period}-${Date.now()}`;
        
        setActivePracticePopups(prev => [...prev, {
            id: popupId,
            ...reminder,
            showLaterOption: true
        }]);
    };

    /**
     * Close practice reminder popup
     * @param {string} popupId - The popup ID to close
     * @param {boolean} showLater - Whether to show the popup later
     */
    const closePracticePopup = (popupId, showLater = false) => {
        setActivePracticePopups(prev => prev.filter(popup => popup.id !== popupId));
        
        if (!showLater) {
            // Update the reminder to mark it as shown
            const popup = activePracticePopups.find(p => p.id === popupId);
            if (popup) {
                const reminderKey = `${popup.day}-${popup.period}`;
                setPracticeReminders(prev => {
                    const updated = { ...prev };
                    if (updated[reminderKey]) {
                        updated[reminderKey].lastShown = new Date();
                        const storageKey = `practice-reminders-${currentTemplate}`;
                        localStorage.setItem(storageKey, JSON.stringify(updated));
                    }
                    return updated;
                });
            }
        }
    };

    /**
     * Check for practice reminders that should be shown
     */
    const checkPracticeReminders = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.getDay();
        
        // Convert JavaScript day (0-6) to school day (1-10)
        // Assuming Mon=1, Tue=2, etc. and handling 10-day cycle
        const schoolDayMap = {
            1: [1, 6], // Monday can be day 1 or 6
            2: [2, 7], // Tuesday can be day 2 or 7
            3: [3, 8], // Wednesday can be day 3 or 8
            4: [4, 9], // Thursday can be day 4 or 9
            5: [5, 10] // Friday can be day 5 or 10
        };
        
        const possibleTomorrowDays = schoolDayMap[tomorrowDay] || [];
        
        Object.entries(practiceReminders).forEach(([key, reminder]) => {
            if (!reminder.enabled) return;
            
            // Check if reminder is for tomorrow
            const isForTomorrow = possibleTomorrowDays.includes(reminder.day);
            
            if (isForTomorrow) {
                // Check if we haven't shown this reminder today
                const lastShown = reminder.lastShown ? new Date(reminder.lastShown) : null;
                const isToday = lastShown && 
                    lastShown.toDateString() === today.toDateString();
                
                if (!isToday) {
                    showPracticePopup(reminder);
                }
            }
        });
    };

    // Load practice reminders from localStorage on component mount and template change
    useEffect(() => {
        if (currentTemplate) {
            const storageKey = `practice-reminders-${currentTemplate}`;
            const savedReminders = localStorage.getItem(storageKey);
            if (savedReminders) {
                try {
                    setPracticeReminders(JSON.parse(savedReminders));
                } catch (error) {
                    console.error('Error loading practice reminders:', error);
                    setPracticeReminders({});
                }
            } else {
                // Clear reminders if no saved data for this template
                setPracticeReminders({});
            }
        }
    }, [currentTemplate]);

    // One-time migration: Move old global practice reminders to template-specific storage
    useEffect(() => {
        const oldReminders = localStorage.getItem('practice-reminders');
        if (oldReminders && currentTemplate) {
            try {
                const reminders = JSON.parse(oldReminders);
                // Migrate to template-specific storage
                const newStorageKey = `practice-reminders-${currentTemplate}`;
                const existingReminders = localStorage.getItem(newStorageKey);
                
                if (!existingReminders) {
                    // Only migrate if no template-specific reminders exist yet
                    localStorage.setItem(newStorageKey, oldReminders);
                    setPracticeReminders(reminders);
                }
                
                // Remove the old global storage
                localStorage.removeItem('practice-reminders');
            } catch (error) {
                console.error('Error migrating practice reminders:', error);
                // If migration fails, just remove the old storage
                localStorage.removeItem('practice-reminders');
            }
        }
    }, [currentTemplate]);

    // Check for practice reminders on component mount and daily
    useEffect(() => {
        checkPracticeReminders();
        
        // Set up daily check at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        let interval = null;
        
        const timeout = setTimeout(() => {
            checkPracticeReminders();
            
            // Set up daily interval
            interval = setInterval(checkPracticeReminders, 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
        
        return () => {
            clearTimeout(timeout);
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [practiceReminders]);

    /**
     * Handle data imports from structured data (JSON/object) 
     * and automatically save as template
     * @param {object|string} importedData - The data to import
     */
    const handleImportData = (importedData) => {
        try {
            console.log("Received import data:", importedData);
            
            // Check if data is already in the correct structured format (from AI tab)
            if (importedData && typeof importedData === 'object' && !Array.isArray(importedData) && 
                importedData.days && importedData.periods && importedData.classes) {
                console.log("Received structured data from AI tab");
                // This is already structured data from the AI tab
                const slots = convertStructuredDataToTimeSlots(importedData);
                
                if (!slots || slots.length === 0) {
                    console.error("Failed to convert structured data to time slots");
                    setNotification({
                        isOpen: true,
                        message: 'Failed to process the structured data. The data format may be invalid or incomplete.',
                        type: 'error',
                        title: 'Import Error'
                    });
                    return;
                }
                
                console.log(`Successfully converted ${slots.length} classes to time slots`);
                timetableService.clearTimetable();
                slots.forEach(slot => {
                    timetableService.addTimeSlot(slot);
                });
                // Ensure recess and lunch periods are preserved
                timetableService.preserveBreakPeriods();
                setTimeSlots(timetableService.getTimeSlots());
                
                // Auto-save as template for structured AI data
                // Generate a meaningful template name using our utility function
                const importedTemplateName = generateImportTemplateName(slots);
                
                // Save the timetable as a template using our utility function
                saveAutoTemplate(
                    importedTemplateName,
                    `Timetable imported successfully and saved as template "${importedTemplateName}"! Added ${slots.length} classes.`,
                    `Timetable imported successfully! Added ${slots.length} classes.`
                )
                return;
            }
            // Raw text input - parse it
            else if (typeof importedData === 'string') {
                if (!importedData.trim()) {
                    setNotification({
                        isOpen: true,
                        message: 'The imported text is empty. Please provide timetable data.',
                        type: 'warning',
                        title: 'Empty Import'
                    });
                    return;
                }
                
                console.log("Parsing raw text input");
                const parsedData = parseTimetable(importedData);
                
                // Check if the parsed data has necessary structure
                if (!parsedData || !parsedData.days || parsedData.days.length === 0) {
                    console.error("Failed to extract days from timetable data");
                    setNotification({
                        isOpen: true,
                        message: 'Could not identify days in your timetable. Please check the format.',
                        type: 'error',
                        title: 'Parsing Error'
                    });
                    return;
                }
                
                if (!parsedData.periods || parsedData.periods.length === 0) {
                    console.error("Failed to extract periods from timetable data");
                    setNotification({
                        isOpen: true,
                        message: 'Could not identify periods in your timetable. Please check the format.',
                        type: 'error',
                        title: 'Parsing Error'
                    });
                    return;
                }
                
                console.log(`Parsed data has ${parsedData.days.length} days and ${parsedData.periods.length} periods`);
                
                // Check if any classes were parsed
                let totalClasses = 0;
                Object.keys(parsedData.classes).forEach(day => {
                    Object.keys(parsedData.classes[day] || {}).forEach(period => {
                        totalClasses += (parsedData.classes[day][period] || []).length;
                    });
                });
                
                if (totalClasses === 0) {
                    console.error("No classes were found in the parsed data");
                    setNotification({
                        isOpen: true,
                        message: 'No classes were found in your timetable. Please check the format.',
                        type: 'error',
                        title: 'Parsing Error'
                    });
                    return;
                }
                
                console.log(`Found ${totalClasses} classes in parsed data`);
                
                const slots = convertStructuredDataToTimeSlots(parsedData);
                if (!slots || slots.length === 0) {
                    console.error("Failed to convert parsed data to time slots");
                    setNotification({
                        isOpen: true,
                        message: 'Failed to process the parsed data. The data may be in an incorrect format.',
                        type: 'error',
                        title: 'Import Error'
                    });
                    return;
                }
                
                console.log(`Successfully converted ${slots.length} classes to time slots`);
                timetableService.clearTimetable();
                slots.forEach(slot => {
                    timetableService.addTimeSlot(slot);
                });
                // Ensure recess and lunch periods are preserved
                timetableService.preserveBreakPeriods();
                setTimeSlots(timetableService.getTimeSlots());
                
                // Auto-save as template for raw text imports
                // Generate a meaningful template name using our utility function
                const importedTemplateName = generateImportTemplateName(slots);
                
                // Save the timetable as a template using our utility function
                saveAutoTemplate(
                    importedTemplateName,
                    `Timetable parsed and imported successfully and saved as template "${importedTemplateName}"! Added ${slots.length} classes.`,
                    `Timetable parsed and imported successfully! Added ${slots.length} classes.`
                )
                return;
            }
            // Legacy format with timeSlots array
            else if (importedData.timeSlots) {
                timetableService.clearTimetable();
                importedData.timeSlots.forEach(slot => {
                    timetableService.addTimeSlot(slot);
                });
                // Ensure recess and lunch periods are preserved
                timetableService.preserveBreakPeriods();
                setTimeSlots(timetableService.getTimeSlots());
                
                // Auto-save as template for legacy timeSlots format
                // Get the imported slots and generate a template name
                const importedSlots = timetableService.getTimeSlots();
                const importedTemplateName = generateImportTemplateName(importedSlots);
                
                // Save the timetable as a template using our utility function
                saveAutoTemplate(
                    importedTemplateName, 
                    `Timetable imported successfully and saved as template "${importedTemplateName}"!`,
                    'Timetable imported successfully!'
                )
                return;
            }
            
            // If we get here, we couldn't process the data
            setNotification({
                isOpen: true,
                message: 'The imported file does not contain any timetable data in a recognized format.',
                type: 'error',
                title: 'Import Error'
            });
        } catch (error) {
            console.error('Error processing imported data:', error);
            setNotification({
                isOpen: true,
                message: 'Failed to process the imported timetable data: ' + error.message,
                type: 'error',
                title: 'Import Error'
            });
        }
    };

    const addTimeSlot = () => {
        const newSlot = { 
            id: Date.now(), 
            day: currentDay,
            period: '', 
            subject: '', 
            startTime: '', 
            endTime: '',
            room: '',
            teacher: '',
            code: ''
        };
        
        timetableService.addTimeSlot(newSlot);
        setTimeSlots([...timeSlots, newSlot]);
    };

    const updateTimeSlot = (id, updatedSlot) => {
        const index = timeSlots.findIndex(slot => 
            slot.id === id || `${slot.day}-${slot.period}` === id
        );
        
        if (index !== -1) {
            console.log('Updating time slot at index:', index);
            console.log('Old slot:', timeSlots[index]);
            console.log('New slot:', updatedSlot);
            
            // Ensure we preserve the day and period values from the original slot
            const finalUpdatedSlot = {
                ...updatedSlot,
                day: timeSlots[index].day,
                period: timeSlots[index].period
            };
            
            // Update the slot in the service
            timetableService.editTimeSlot(index, finalUpdatedSlot);
            
            // Update the state immutably
            const updatedSlots = [...timeSlots];
            updatedSlots[index] = finalUpdatedSlot;
            setTimeSlots(updatedSlots);
            
            console.log('Updated slots array:', updatedSlots);
        }
        
        // Close the editing form
        setCurrentEditingSlot(null);
    };

    const removeTimeSlot = (id) => {
        const index = timeSlots.findIndex(slot => 
            slot.id === id || `${slot.day}-${slot.period}` === id
        );
        
        if (index !== -1) {
            timetableService.deleteTimeSlot(index);
            const updatedSlots = [...timeSlots];
            updatedSlots.splice(index, 1);
            setTimeSlots(updatedSlots);
        }
        
        // If the removed slot was being edited, close the editing form
        if (currentEditingSlot === id) {
            setCurrentEditingSlot(null);
        }
    };

    // Handle when a user starts editing a slot
    const handleStartEditing = (id) => {
        console.log('Starting edit for slot:', id);
        // Enable edit mode if not already enabled
        if (!editMode) {
            setEditMode(true);
        }
        setCurrentEditingSlot(id);
    };
    
    // Handle when a user cancels editing
    const handleCancelEditing = () => {
        console.log('Canceling edit');
        setCurrentEditingSlot(null);
    };

    // Get all periods for the selected day
    const getPeriods = () => {
        // Start with all non-break periods
        const allPeriods = ['1', '2', 'Tutorial', '3', '4', '5', 'After School'];
        
        // Show break periods if they should be visible based on time OR if we're in edit mode
        if (visiblePeriods.Recess || editMode) {
            // Insert Recess after Tutorial
            allPeriods.splice(3, 0, 'Recess');
        }
        
        if (visiblePeriods.Lunch || editMode) {
            // Insert Lunch after period 4
            allPeriods.splice(allPeriods.indexOf('4') + 1, 0, 'Lunch');
        }
        
        return allPeriods;
    };

    // Filter slots by day and period
    const filterSlots = (day, period) => {
        return timeSlots.filter(slot => 
            slot.day === day && 
            String(slot.period) === String(period)
        );
    };

    // Store a reference to each period's corresponding label
    const getPeriodLabelRef = (period) => {
        if (!labelRefs.current[period]) {
            labelRefs.current[period] = React.createRef();
        }
        return labelRefs.current[period];
    };

    // Keep left period labels aligned in height with right rows
    useEffect(() => {
        const periods = getPeriods();
        const syncHeights = () => {
            periods.forEach(p => {
                const labelEl = labelRefs.current[p]?.current;
                const rowEl = document.querySelector(`.day-column .period-row[data-period="${p}"]`);
                if (!labelEl || !rowEl) return;
                // Reset to auto first to measure natural heights
                labelEl.style.height = 'auto';
                rowEl.style.height = 'auto';
                const labelMin = parseFloat(getComputedStyle(labelEl).minHeight || '0');
                const rowMin = parseFloat(getComputedStyle(rowEl).minHeight || '0');
                const labelH = Math.max(labelEl.scrollHeight || 0, labelEl.offsetHeight || 0);
                const rowH = Math.max(rowEl.scrollHeight || 0, rowEl.offsetHeight || 0);
                const target = Math.max(labelH, rowH, labelMin, rowMin);
                labelEl.style.height = `${target}px`;
                rowEl.style.height = `${target}px`;
            });
        };

        // Throttle reflows with rAF to avoid ResizeObserver loops
        let rafId = null;
        let pending = false;
        const scheduleSync = () => {
            if (pending) return;
            pending = true;
            rafId = requestAnimationFrame(() => {
                pending = false;
                syncHeights();
            });
        };

        // Run after paint with a second pass for animation settle
        const raf = requestAnimationFrame(() => {
            scheduleSync();
            setTimeout(scheduleSync, 200);
        });
        // Resize observer to react to content changes
        const ro = new ResizeObserver(() => {
            scheduleSync();
        });
        periods.forEach(p => {
            const rowEl = document.querySelector(`.day-column .period-row[data-period="${p}"]`);
            if (rowEl) {
                ro.observe(rowEl);
                const editEl = rowEl.querySelector('.time-slot.editing');
                if (editEl) ro.observe(editEl);
            }
        });
        const resizeHandler = () => scheduleSync();
        window.addEventListener('resize', resizeHandler);

        return () => {
            cancelAnimationFrame(raf);
            if (rafId) cancelAnimationFrame(rafId);
            try { ro.disconnect(); } catch {}
            window.removeEventListener('resize', resizeHandler);
            // Cleanup explicit heights to allow CSS to control
            periods.forEach(p => {
                const labelEl = labelRefs.current[p]?.current;
                const rowEl = document.querySelector(`.day-column .period-row[data-period="${p}"]`);
                if (labelEl) labelEl.style.height = '';
                if (rowEl) rowEl.style.height = '';
            });
        };
    }, [timeSlots, currentDay, editMode, visiblePeriods.Recess, visiblePeriods.Lunch, currentEditingSlot]);

    // Listen for color changes
    useEffect(() => {
        const handleColorChange = () => {
            // Force a re-render of the timetable by updating the timeSlots array
            // This will cause all TimeSlot components to re-render with new colors
            setTimeSlots([...timeSlots]);
        };
        
        // Add event listener for color changes
        window.addEventListener('timetable-colors-changed', handleColorChange);
        
        // Clean up event listener
        return () => {
            window.removeEventListener('timetable-colors-changed', handleColorChange);
        };
    }, [timeSlots]);

    // Helper function to save timetable data using Firestore when available
    const saveTimetableData = async (newTimeSlots = timeSlots) => {
        try {
            if (isFirestoreReady && timetableManager) {
                // Save to Firestore
                await timetableManager.saveTimetable({
                    timeSlots: newTimeSlots,
                    currentDay: currentDay
                });
                debugLog('✅ Timetable saved to Firestore');
            } else {
                // Fallback to localStorage (existing behavior)
                debugLog('💾 Saving to localStorage (Firestore not ready)');
                // The existing timetableService already handles localStorage
            }
        } catch (error) {
            console.error('❌ Error saving timetable:', error);
            // On error, fall back to localStorage
            debugLog('💾 Falling back to localStorage due to error');
        }
    };

    // Helper function to load timetable data from Firestore when available
    const loadTimetableData = async () => {
        try {
            if (isFirestoreReady && timetableManager) {
                // Load from Firestore
                const timetableData = await timetableManager.loadTimetable();
                if (timetableData && timetableData.timeSlots) {
                    setTimeSlots(timetableData.timeSlots);
                    if (timetableData.currentDay) {
                        setCurrentDay(timetableData.currentDay);
                    }
                    debugLog('✅ Timetable loaded from Firestore');
                    return true;
                }
            }
            return false; // Indicate that Firestore load was not successful
        } catch (error) {
            console.error('❌ Error loading timetable from Firestore:', error);
            return false; // Fall back to localStorage
        }
    };
    
    // Auto-save to Firestore when timeSlots change (debounced)
    useEffect(() => {
        if (timeSlots.length > 0 && isFirestoreReady) {
            // Debounce the save operation to avoid too many writes
            const timeoutId = setTimeout(() => {
                saveTimetableData(timeSlots);
            }, 1000); // Wait 1 second after last change

            return () => clearTimeout(timeoutId);
        }
    }, [timeSlots, isFirestoreReady]);
    
    return (
        <MobileDetector
            timeSlots={timeSlots}
            currentTemplate={currentTemplate}
            templates={templates}
            currentDay={currentDay}
            onDayChange={setCurrentDay}
            editMode={editMode}
        >
            <div className="timetable-container">
            <div className="timetable-header">
                <div className="header-main">
                    <h2>School Timetable</h2>
                    {isAdminUser && (
                        <div className="admin-controls header-admin">
                            <button 
                                className="admin-button-header" 
                                onClick={() => setShowAdminDashboard(true)}
                                title="Open Admin Dashboard"
                            >
                                🛠️
                            </button>
                            <button 
                                className="admin-button-header terminal" 
                                onClick={() => setShowAdminTerminal(true)}
                                title="Open Admin Terminal"
                            >
                                💻
                            </button>
                        </div>
                    )}
                </div>
                <div className="current-day-display">
                    <span>{getDayName(currentDay)}</span>
                </div>
                
                <div className="template-controls">
                    <div className="default-timetable-dropdown-container">
                        <select 
                            value={currentTemplate} 
                            onChange={(e) => loadTemplate(e.target.value)}
                            className="default-timetable-btn"
                            aria-label="Choose a timetable template"
                        >
                            <option value="" disabled>Default Timetable</option>
                            {templates.map(template => (
                                <option key={template} value={template}>
                                    {template.charAt(0).toUpperCase() + template.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {currentTemplate && currentTemplate !== 'school' && (
                        <button 
                            className="delete-template-btn" 
                            onClick={() => deleteTemplate(currentTemplate)}
                        >
                            Delete
                        </button>
                    )}
                    
                    <div className="save-template">
                        <button 
                            className="save-template-btn"
                            onClick={saveTemplate}
                        >
                            Save Template
                        </button>
                    </div>
                    
                    <button 
                        className={`edit-mode-toggle ${editMode ? 'active' : ''}`}
                        onClick={() => {
                            setEditMode(!editMode);
                            // Close any open editing form when toggling edit mode
                            setCurrentEditingSlot(null);
                        }}
                    >
                        {editMode ? 'View Mode' : 'Edit Mode'}
                    </button>
                    
                    <button 
                        className="color-legend-btn"
                        onClick={() => openColorsWindow()}
                    >
                        Colours
                    </button>
                    
                    <ImportButton onImport={importTimetable} />
                </div>
                
                {editMode && (
                    <div className="edit-mode-hint">
                        <p>Click directly on any class to edit its details, or use the <span className="edit-button-hint">Edit</span> button</p>
                    </div>
                )}
                
                <div className="day-selector">
                    {days.map(day => {
                        // Get today's real school day number
                        const todayDay = getCurrentSchoolDay();
                        const isToday = day === todayDay;
                        
                        // Check if it's a weekend
                        const today = new Date();
                        
                        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
                        const isSaturday = dayOfWeek === 6;
                        const isSunday = dayOfWeek === 0;
                        
                        // Helper function to get appropriate hover text
                        const getHoverText = () => {
                            if (!isToday) return null;
                            if (isSaturday) return "2 days";
                            if (isSunday) return "1 day";
                            return "Today";
                        };
                        
                        // Determine the title for the button
                        let titleText = getDayName(day);
                        if (isToday) {
                            const hoverText = getHoverText();
                            titleText += ` (${hoverText})`;
                        }
                        
                        return (
                            <button 
                                key={day} 
                                type="button"
                                className={`day-button ${currentDay === day ? 'active' : ''} ${isToday ? 'current-day' : ''}`}
                                onClick={(e) => handleDayChange(e, day)}
                                title={titleText}
                            >
                                <span>Day {day}</span>
                                {isToday && <span className="today-text">{getHoverText()}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="timetable">
                <div className="periods-column">
                    {getPeriods().map(period => {
                        const isEditingThisPeriod = filterSlots(currentDay, period).some(
                            slot => currentEditingSlot === (slot.id || `${slot.day}-${slot.period}`)
                        );
                        
                        return (
                            <div 
                                key={period} 
                                className={`period-label ${isEditingThisPeriod ? 'editing' : ''}`}
                                data-period={period}
                                ref={getPeriodLabelRef(period)}
                            >
                                <span>{period}</span>
                                {period === '1' && <span className="time">8:35am–9:35am</span>}
                                {period === '2' && <span className="time">9:40am–10:40am</span>}
                                {period === 'Tutorial' && <span className="time">10:45am–10:55am</span>}
                                {period === 'Recess' && <span className="time">10:55am–11:25am</span>}
                                {period === '3' && <span className="time">11:25am–12:25pm</span>}
                                {period === '4' && <span className="time">12:30pm–1:30pm</span>}
                                {period === 'Lunch' && <span className="time">1:30pm–2:25pm</span>}
                                {period === '5' && <span className="time">2:25pm–3:25pm</span>}
                                {period === 'After School' && <span className="time">3:35pm–4:30pm</span>}
                            </div>
                        );
                    })}
                </div>
                
                <div className="day-column">
                    {getPeriods().map(period => {
                        const isEditingThisPeriod = filterSlots(currentDay, period).some(
                            slot => currentEditingSlot === (slot.id || `${slot.day}-${slot.period}`)
                        );
                        
                        return (
                            <div 
                                key={period} 
                                className={`period-row ${isEditingThisPeriod ? 'has-editing-slot' : ''}`}
                                data-period={period}
                                ref={isEditingThisPeriod ? editingRowRef : null}
                            >
                                {filterSlots(currentDay, period).map(slot => (
                                    <TimeSlot
                                        key={slot.id || `${slot.day}-${slot.period}`}
                                        slot={slot}
                                        onUpdate={updateTimeSlot}
                                        onRemove={removeTimeSlot}
                                        isEditing={currentEditingSlot === (slot.id || `${slot.day}-${slot.period}`)}
                                        onStartEditing={handleStartEditing}
                                        onCancelEditing={handleCancelEditing}
                                        displaySettings={displaySettings}
                                        isCurrentPeriod={currentPeriod !== null && slot.day === getCurrentSchoolDay() && String(slot.period) === String(currentPeriod)}
                                        editMode={editMode}
                                        hasPracticeReminder={hasPracticeReminder(slot.day, slot.period)}
                                        onTogglePracticeReminder={() => togglePracticeReminder(slot.day, slot.period, slot)}
                                    />
                                ))}
                                
                                {editMode && filterSlots(currentDay, period).length === 0 && (
                                    <div className="add-time-slot">
                                        <button 
                                            onClick={() => {
                                                const newSlot = {
                                                    day: currentDay,
                                                    period: period,
                                                    startTime: period === '1' ? '8:35am' :
                                                              period === '2' ? '9:40am' :
                                                              period === 'Tutorial' ? '10:45am' :
                                                              period === '3' ? '11:25am' :
                                                              period === '4' ? '12:30pm' :
                                                              period === '5' ? '2:25pm' : '3:35pm',
                                                    endTime: period === '1' ? '9:35am' :
                                                             period === '2' ? '10:40am' :
                                                             period === 'Tutorial' ? '10:55am' :
                                                             period === '3' ? '12:25pm' :
                                                             period === '4' ? '1:30pm' :
                                                             period === '5' ? '3:25pm' : '4:30pm',
                                                    subject: '',
                                                    code: '',
                                                    room: '',
                                                    teacher: ''
                                                };
                                                
                                                timetableService.addTimeSlot(newSlot);
                                                setTimeSlots([...timeSlots, newSlot]);
                                            }}
                                        >
                                            + Add Class
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Admin Interfaces */}
            {showAdminTerminal && (
                <AdminTerminal onClose={() => setShowAdminTerminal(false)} />
            )}
            
            {showAdminDashboard && (
                <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
            )}
            
            {/* Template Name Popup */}
            <TemplateNamePopup
                isOpen={templatePopup.isOpen}
                suggestedName={templatePopup.suggestedName}
                onSave={templatePopup.onSave}
                onClose={() => setTemplatePopup(prev => ({ ...prev, isOpen: false }))}
            />
            
            {/* Notification Popup - replaces alert() */}
            <NotificationPopup 
                isOpen={notification.isOpen}
                message={notification.message}
                type={notification.type}
                title={notification.title}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            />
            
            {/* Confirm Dialog - replaces window.confirm() */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
            
            {/* Colors Popup - fullscreen color customization */}
            <ColorsPopup 
                isVisible={showColorLegend}
                onClose={() => setShowColorLegend(false)}
            />
            
            {/* Practice Reminder Popups */}
            {activePracticePopups.map(popup => (
                <PracticeReminderPopup
                    key={popup.id}
                    isOpen={true}
                    practiceData={popup}
                    onClose={() => closePracticePopup(popup.id)}
                    onShowLater={() => closePracticePopup(popup.id, true)}
                />
            ))}
            </div>
        </MobileDetector>
    );
};

export default Timetable;
