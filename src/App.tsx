import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./components/Login";
import AdminPanel from "./components/AdminPanel";
import FranchisePortal from "./components/FranchisePortal";
import SplashScreen from "./components/SplashScreen";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is an admin in Firestore
        const adminDoc = await getDoc(doc(db, "adminUsers", currentUser.uid));
        if (adminDoc.exists() || currentUser.email === "samra20020413@gmail.com") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return isAdmin ? <AdminPanel /> : <FranchisePortal />;
}
