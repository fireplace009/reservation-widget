import { auth } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        if (result.user.email !== 'patteeuw.bernard@gmail.com') {
            await signOut(auth);
            throw new Error('Unauthorized email');
        }
        return result.user;
    } catch (error) {
        console.error("Error logging in with Google", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error logging out", error);
        throw error;
    }
};

export const observeAuthState = (callback) => {
    return onAuthStateChanged(auth, (user) => {
        if (user && user.email !== 'patteeuw.bernard@gmail.com') {
            signOut(auth);
            callback(null);
        } else {
            callback(user);
        }
    });
};
