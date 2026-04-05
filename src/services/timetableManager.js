// Helper to integrate Firestore timetable service with existing code
import { debugLog } from '../utils/debug';

export class TimetableManager {
    constructor(firestoreService, localService) {
        this.firestoreService = firestoreService;
        this.localService = localService;
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncToFirestore();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    /**
     * Save timetable with fallback to localStorage when offline
     */
    async saveTimetable(timetableData) {
        if (this.isOnline) {
            try {
                await this.firestoreService.saveTimetable(timetableData);
                // Also save locally as backup
                this.saveToLocalStorage(timetableData);
                return true;
            } catch (error) {
                console.warn('Firestore save failed, falling back to localStorage:', error);
                // Use localStorage directly since timetableService doesn't have this method
                this.saveToLocalStorage(timetableData);
                return false;
            }
        } else {
            // Offline: save to localStorage
            this.saveToLocalStorage(timetableData);
            return false;
        }
    }

    /**
     * Save data to localStorage directly
     */
    saveToLocalStorage(timetableData) {
        try {
            localStorage.setItem('timetable-data', JSON.stringify(timetableData));
            debugLog('💾 Saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }

    /**
     * Load data from localStorage directly  
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('timetable-data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            return null;
        }
    }

    /**
     * Load timetable with fallback to localStorage
     */
    async loadTimetable() {
        if (this.isOnline) {
            try {
                return await this.firestoreService.loadTimetable();
            } catch (error) {
                console.warn('Firestore load failed, falling back to localStorage:', error);
                return this.loadFromLocalStorage();
            }
        } else {
            return this.loadFromLocalStorage();
        }
    }

    /**
     * Sync localStorage data to Firestore when online
     */
    async syncToFirestore() {
        if (!this.isOnline) return;

        try {
            // Check if there's newer data in localStorage that needs syncing
            const localData = this.loadFromLocalStorage();
            if (localData && localData.timeSlots && localData.timeSlots.length > 0) {
                await this.firestoreService.saveTimetable(localData);
                debugLog('✅ Local data synced to Firestore');
            }
        } catch (error) {
            console.error('❌ Error syncing to Firestore:', error);
        }
    }

    /**
     * Perform initial migration from localStorage to Firestore
     */
    async migrate() {
        if (this.isOnline) {
            return await this.firestoreService.migrateFromLocalStorage();
        }
        return false;
    }
}
