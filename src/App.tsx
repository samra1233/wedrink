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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if user is an admin in Firestore
        try {
          const adminDoc = await getDoc(doc(db, "adminUsers", currentUser.uid));
          if (adminDoc.exists() || currentUser.email === "samra20020413@gmail.com") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(null);
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

  if (loading || (user && isAdmin === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return isAdmin ? <AdminPanel /> : <FranchisePortal />;
}
