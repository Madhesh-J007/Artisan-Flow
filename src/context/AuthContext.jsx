import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null); // { role, name, ...profile fields }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setFirebaseUser(user);
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        setUserDoc(snap.exists() ? snap.data() : null);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function register(email, password, role, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const baseDoc =
      role === "artisan"
        ? {
            role: "artisan",
            name,
            craft: "",
            product: "",
            productKeywords: [],
            productionCostPerUnit: null,
            weeklyCapacityUnits: null,
            location: "",
            languagePreference: "Tamil",
            yearsExperience: 0,
            profileComplete: false
          }
        : {
            role: "retailer",
            name,
            buyerType: "D2C brand"
          };
    await setDoc(doc(db, "users", cred.user.uid), baseDoc);
    setUserDoc(baseDoc);
    return cred.user;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    setUserDoc(snap.exists() ? snap.data() : null);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  async function updateArtisanProfile(profileFields) {
    if (!firebaseUser) return;
    const updated = { ...userDoc, ...profileFields, profileComplete: true };
    await setDoc(doc(db, "users", firebaseUser.uid), updated, { merge: true });
    setUserDoc(updated);
  }

  const value = {
    firebaseUser,
    userDoc,
    loading,
    register,
    login,
    logout,
    updateArtisanProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
