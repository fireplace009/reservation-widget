import { db } from './firebase-config.js';
import { collection, doc, setDoc, getDoc, updateDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'customers';

/**
 * Creates or updates a customer profile.
 * If the document doesn't exist, it creates it with 'pending' status.
 * @param {Object} user - The Firebase Auth user object
 * @param {Object} profileData - Additional profile data (companyName, vat, etc.)
 */
export const createCustomerProfile = async (user, profileData = {}) => {
    const customerRef = doc(db, COLLECTION_NAME, user.uid);
    const snapshot = await getDoc(customerRef);

    if (!snapshot.exists()) {
        await setDoc(customerRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            companyName: profileData.companyName || '',
            vatNumber: profileData.vatNumber || '',
            address: profileData.address || '',
            logoUrl: profileData.logoUrl || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        });
    } else {
        // If it exists, we might want to update some fields, but keep status
        await updateDoc(customerRef, {
            ...profileData,
            email: user.email, // Ensure email is up to date
            displayName: user.displayName || snapshot.data().displayName,
            photoURL: user.photoURL || snapshot.data().photoURL
        });
    }
};

/**
 * Updates an existing customer profile.
 * @param {string} uid 
 * @param {Object} data 
 */
export const updateCustomerProfile = async (uid, data) => {
    const customerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(customerRef, data);
};

/**
 * Retrieves a customer profile by UID.
 * @param {string} uid 
 * @returns {Promise<Object|null>}
 */
export const getCustomer = async (uid) => {
    const customerRef = doc(db, COLLECTION_NAME, uid);
    const snapshot = await getDoc(customerRef);
    if (snapshot.exists()) {
        return snapshot.data();
    }
    return null;
};

/**
 * Fetches all customers (for Super Admin).
 * @returns {Promise<Array>}
 */
export const getAllCustomers = async () => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
};

/**
 * Updates a customer's status (e.g., 'approved', 'declined').
 * @param {string} uid 
 * @param {string} status 
 */
export const updateCustomerStatus = async (uid, status) => {
    const customerRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(customerRef, { status });
};
