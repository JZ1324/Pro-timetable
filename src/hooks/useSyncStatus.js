import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import FirestoreTimetableService from '../services/firestoreTimetableService';
import { TimetableManager } from '../services/timetableManager';
import timetableService from '../services/timetableService';
import { debugLog } from '../utils/debug';

export const useSyncStatus = () => {
    const { user } = useAuth();
    const [isFirestoreReady, setIsFirestoreReady] = useState(false);
    const [firestoreService, setFirestoreService] = useState(null);
    const [timetableManager, setTimetableManager] = useState(null);

    useEffect(() => {
        const initializeFirestore = async () => {
            if (user) {
                try {
                    debugLog('🔥 Initializing Firestore sync services...');
                    
                    // Use the existing Firebase v8 compat instance from the auth service
                    if (typeof window !== 'undefined' && window.firebase && window.firebase.firestore) {
                        debugLog('🔥 Using Firebase v8 compat SDK for Firestore...');
                        
                        const db = window.firebase.firestore();
                        const firestoreService = new FirestoreTimetableService(db, user.uid);
                        const manager = new TimetableManager(firestoreService, timetableService);
                        
                        setFirestoreService(firestoreService);
                        setTimetableManager(manager);
                        
                        // Perform migration from localStorage to Firestore if needed
                        await manager.migrate();
                        
                        setIsFirestoreReady(true);
                        debugLog('✅ Firestore sync services ready');
                    } else {
                        console.warn('⚠️ Firebase v8 compat SDK not available, falling back to localStorage');
                        setIsFirestoreReady(false);
                    }
                } catch (error) {
                    console.error('❌ Error initializing Firestore services:', error);
                    setIsFirestoreReady(false);
                }
            } else {
                // User not authenticated, use localStorage only
                setIsFirestoreReady(false);
                setFirestoreService(null);
                setTimetableManager(null);
                debugLog('👤 User not authenticated, using localStorage only');
            }
        };

        initializeFirestore();
    }, [user]);

    return {
        isFirestoreReady,
        firestoreService,
        timetableManager
    };
};
