import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return signInWithPopup(auth, provider);
};

export const logOut = () => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return signOut(auth);
};

export const onAuthChange = (callback) => {
    if (!auth) {
        callback(null);
        return () => { };
    }
    return onAuthStateChanged(auth, callback);
};
