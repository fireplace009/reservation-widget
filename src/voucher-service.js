import { db } from './firebase-config.js';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, query, orderBy, where, Timestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'vouchers';

/**
 * Creates a new voucher.
 * @param {Object} voucherData - { name, email, amount }
 * @returns {Promise<string>} - The unique voucher code (ID).
 */
export const createVoucher = async (voucherData) => {
    // Generate a unique code (for now, we'll use the document ID as the code, 
    // but in a real app you might want a shorter, readable code)
    // Let's generate a random 8-character alphanumeric code for better UX
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        code: code,
        name: voucherData.name,
        email: voucherData.email,
        description: voucherData.description || '',
        initialAmount: Number(voucherData.amount),
        remainingAmount: Number(voucherData.amount),
        createdAt: new Date().toISOString(),
        history: [] // Array of { date, amount, type: 'purchase' | 'redemption' }
    });

    // We might want to store the code in the doc as well for easier querying if we use custom IDs
    // But here we just used a random string as a field.
    // Wait, if we use addDoc, the ID is auto-generated. 
    // Let's stick to the plan: use a field 'code' for the scanable content.

    return code;
};

/**
 * Retrieves a voucher by its unique code.
 * @param {string} code 
 * @returns {Promise<Object|null>}
 */
export const getVoucherByCode = async (code) => {
    const q = query(collection(db, COLLECTION_NAME), where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
};

/**
 * Redeems a specific amount from a voucher.
 * @param {string} code 
 * @param {number} amount 
 * @returns {Promise<Object>} - { success: boolean, message: string, newBalance: number }
 */
export const redeemVoucher = async (code, amount) => {
    const voucher = await getVoucherByCode(code);

    if (!voucher) {
        throw new Error('Voucher not found');
    }

    if (voucher.remainingAmount < amount) {
        throw new Error('Insufficient funds');
    }

    const newBalance = voucher.remainingAmount - amount;
    const newHistoryItem = {
        date: new Date().toISOString(),
        amount: amount,
        type: 'redemption'
    };

    const voucherRef = doc(db, COLLECTION_NAME, voucher.id);
    await updateDoc(voucherRef, {
        remainingAmount: newBalance,
        history: [...(voucher.history || []), newHistoryItem]
    });

    return { success: true, newBalance };
};

/**
 * Fetches all vouchers, ordered by creation date.
 * @returns {Promise<Array>}
 */
export const getAllVouchers = async () => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
