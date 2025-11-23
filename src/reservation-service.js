import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, Timestamp, orderBy, updateDoc } from 'firebase/firestore';
import { CONFIG } from './config.js';

const COLLECTION_NAME = 'reservations';

/**
 * Fetches reservations for a specific date.
 * @param {string} dateStr - Date string in YYYY-MM-DD format.
 * @returns {Promise<Array>} - List of reservations.
 */
export const getReservations = async (dateStr) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '==', dateStr)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches a single reservation by ID.
 * @param {string} id - Reservation ID.
 * @returns {Promise<Object|null>} - Reservation object or null if not found.
 */
export const getReservationById = async (id) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await import('firebase/firestore').then(module => module.getDoc(docRef));

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        return null;
    }
};

/**
 * Checks if there is enough capacity for a reservation.
 * @param {string} date - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @param {number} guests - Number of guests
 * @returns {Promise<boolean>} - True if available, false otherwise.
 */
export const checkAvailability = async (date, time, guests) => {
    const reservations = await getReservations(date);

    // Filter reservations for the same time slot
    const slotReservations = reservations.filter(r => r.time === time && r.status !== 'cancelled');

    // Check if any reservation is blocked
    const isBlocked = slotReservations.some(r => r.type === 'blocked');
    if (isBlocked) {
        return false;
    }

    // Calculate total guests in this slot
    const currentCapacity = slotReservations.reduce((sum, r) => sum + r.guests, 0);

    return (currentCapacity + guests) <= CONFIG.MAX_CAPACITY_PER_SLOT;
};

/**
 * Adds a new reservation to Firestore.
 * @param {Object} reservation - Reservation data.
 * @returns {Promise<string>} - The ID of the new reservation.
 */
export const addReservation = async (reservation) => {
    const docRef = await addDoc(collection(db, 'reservations'), {
        date: reservation.date,
        time: reservation.time,
        guests: Number(reservation.guests),
        name: reservation.name || 'Guest',
        email: reservation.email,
        phone: reservation.phone || '',
        description: reservation.description || '',
        status: 'confirmed', // 'confirmed', 'cancelled'
        type: reservation.type || 'regular', // 'regular' or 'blocked'
        createdAt: new Date().toISOString()
    });
    return docRef.id;
};

/**
 * Updates an existing reservation.
 * @param {string} id - Reservation ID.
 * @param {Object} data - Data to update.
 * @returns {Promise<void>}
 */
export const updateReservation = async (id, data) => {
    await updateDoc(doc(db, COLLECTION_NAME, id), data);
};

/**
 * Fetches all reservations ordered by creation time (newest first).
 * @returns {Promise<Array>} - List of all reservations.
 * @returns {Promise<Array>} - List of all reservations.
 */
export const getAllReservations = async () => {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Deletes a reservation from Firestore.
 * @param {string} id - The ID of the reservation to delete.
 * @returns {Promise<void>}
 */
export const deleteReservation = async (id) => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};
