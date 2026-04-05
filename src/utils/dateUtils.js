// This file contains utility functions for date manipulation and formatting.

export const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

export const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const getStartOfWeek = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    return start;
};

export const getEndOfWeek = (date) => {
    const end = new Date(date);
    const day = end.getDay();
    const diff = end.getDate() + (day === 0 ? 0 : 7 - day); // adjust when day is sunday
    end.setDate(diff);
    return end;
};

// Get the ISO week number of the year
export const getWeekNumber = (date) => {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Get the current school day number (1-10) based on the current date and user settings
export const getCurrentSchoolDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get user settings
    const savedSettings = localStorage.getItem('timetable-settings');
    let settings = {
        startWithWeek: 'B' // Default to Week B
    };
    
    if (savedSettings) {
        try {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings.startWithWeek) {
                settings.startWithWeek = parsedSettings.startWithWeek;
            }
        } catch (error) {
            console.error('Error parsing settings:', error);
        }
    }
    
    // If it's weekend, calculate based on the following Monday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Calculate the correct week type for the upcoming Monday
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (dayOfWeek === 0 ? 1 : 2)); // Add days to get to Monday
        return determineSchoolDay(nextMonday, settings.startWithWeek);
    }
    
    // For weekdays, calculate the current day number
    return determineSchoolDay(today, settings.startWithWeek);
};

// Determine the school day (1-10) based on the date and user preference
const determineSchoolDay = (date, userPreferredStart) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the week of the year
    const weekNumber = getWeekNumber(date);
    
    // Determine if this is Week A or Week B
    // Week A is odd-numbered weeks, Week B is even-numbered weeks
    // This can be flipped if user sets preference to start with Week B
    let isWeekA = weekNumber % 2 === 1; // Odd weeks are Week A by default
    
    // If user prefers to start with Week B, flip the week type
    if (userPreferredStart === 'B') {
        isWeekA = !isWeekA;
    }
    
    // Calculate day number based on week type and day of week
    if (isWeekA) {
        // Week A: Days 1-5
        return dayOfWeek; // Monday = 1, Tuesday = 2, etc.
    } else {
        // Week B: Days 6-10
        return dayOfWeek + 5; // Monday = 6, Tuesday = 7, etc.
    }
};

// Get the current period based on the current time
export const getCurrentPeriod = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Check if it's a weekend (Saturday or Sunday)
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
        return null; // Return null on weekends
    }
    
    // Check if it's outside school hours (before 8:30am or after 4:30pm)
    if (totalMinutes < 8 * 60 + 30 || totalMinutes > 16 * 60 + 30) {
        return null; // Return null outside school hours
    }
    
    // Define period time ranges in minutes from midnight
    const periodRanges = [
        { period: '1', start: 8 * 60 + 35, end: 9 * 60 + 35 }, // 8:35am - 9:35am
        { period: '2', start: 9 * 60 + 35, end: 10 * 60 + 35 }, // 9:35am - 10:35am
        { period: 'Tutorial', start: 10 * 60 + 35, end: 11 * 60 + 5 }, // 10:35am - 11:05am
        { period: 'Recess', start: 10 * 60 + 55, end: 11 * 60 + 25 }, // 10:55am - 11:25am
        { period: '3', start: 11 * 60 + 30, end: 12 * 60 + 30 }, // 11:30am - 12:30pm
        { period: '4', start: 12 * 60 + 30, end: 13 * 60 + 30 }, // 12:30pm - 1:30pm
        { period: 'Lunch', start: 13 * 60 + 30, end: 14 * 60 + 25 }, // 1:30pm - 2:25pm
        { period: '5', start: 14 * 60 + 25, end: 15 * 60 + 25 }, // 2:25pm - 3:25pm
        { period: 'After School', start: 15 * 60 + 35, end: 16 * 60 + 30 } // 3:35pm - 4:30pm
    ];
    
    // Find the current period
    for (const range of periodRanges) {
        if (totalMinutes >= range.start && totalMinutes < range.end) {
            return range.period;
        }
    }
    
    // If between periods but still during school hours, return null
    return null;
};

// Check if a break period should be shown (5 minutes before it starts or during it)
export const shouldShowBreakPeriod = (periodName) => {
    if (periodName !== 'Recess' && periodName !== 'Lunch') {
        return true; // Always show non-break periods
    }
    
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Don't show break periods on weekends
    if (day === 0 || day === 6) {
        return false;
    }
    
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Don't show break periods outside of school hours
    if (totalMinutes < 8 * 60 + 30 || totalMinutes > 16 * 60 + 30) {
        return false;
    }
    
    // Define break periods
    const breakPeriods = {
        'Recess': { start: 10 * 60 + 55, end: 11 * 60 + 25 }, // 10:55am - 11:25am
        'Lunch': { start: 13 * 60 + 30, end: 14 * 60 + 25 } // 1:30pm - 2:25pm
    };
    
    const period = breakPeriods[periodName];
    
    // Show break 5 minutes before it starts and during the break
    const showBreakStart = period.start - 5;
    
    // Show if we're 5 minutes before break or during break
    if (totalMinutes >= showBreakStart && totalMinutes < period.end) {
        return true;
    }
    
    return false;
};

export const parseTimeToMinutes = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return null;

    const normalized = timeString.trim().toLowerCase().replace(/\s+/g, '');

    // 24-hour format, e.g. 14:35
    let match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
        return hours * 60 + minutes;
    }

    // 12-hour format, e.g. 8:35am / 12:10pm
    match = normalized.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

    if (meridiem === 'am') {
        if (hours === 12) hours = 0;
    } else if (hours !== 12) {
        hours += 12;
    }

    return hours * 60 + minutes;
};

export const normalizeDay = (dayValue = '') => dayValue.toString().trim().toLowerCase();

export const hasTimeRangeConflict = (startA, endA, startB, endB) => {
    const aStart = parseTimeToMinutes(startA);
    const aEnd = parseTimeToMinutes(endA);
    const bStart = parseTimeToMinutes(startB);
    const bEnd = parseTimeToMinutes(endB);

    if ([aStart, aEnd, bStart, bEnd].some((v) => v === null)) return false;
    if (aEnd <= aStart || bEnd <= bStart) return false;

    return aStart < bEnd && bStart < aEnd;
};

export const hasTimetableConflict = (entryA, entryB) => {
    if (!entryA || !entryB) return false;
    if (normalizeDay(entryA.day) !== normalizeDay(entryB.day)) return false;

    return hasTimeRangeConflict(entryA.startTime, entryA.endTime, entryB.startTime, entryB.endTime);
};

export const findTimetableConflicts = (entries = []) => {
    const conflicts = [];
    for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
            if (hasTimetableConflict(entries[i], entries[j])) {
                conflicts.push([entries[i], entries[j]]);
            }
        }
    }
    return conflicts;
};