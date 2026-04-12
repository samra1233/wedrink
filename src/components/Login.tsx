import { useState } from "react";
import React from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Set persistence to session (clears when tab/browser is closed)
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Invalid email or password. Please check your credentials.");
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background with Image and Teal Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/lunb3.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/90 via-teal-900/95 to-slate-900/100" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-4"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/95 backdrop-blur-2xl p-10 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-white/40 space-y-8 relative overflow-hidden"
        >
          {/* Subtle inner glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
          
          <div className="text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto overflow-hidden bg-white shadow-2xl shadow-teal-900/10 border border-slate-100 p-5 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src="/Logo.png" alt="WEDRINK Logo" className="w-full h-full object-contain relative z-10" />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter bg-gradient-to-br from-slate-900 to-slate-500 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-slate-500 font-semibold tracking-wide text-sm uppercase">
                Franchise Portal Access
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] ml-1">
                Authorized Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-slate-400 w-5 h-5 group-focus-within:text-teal-600 transition-colors" />
                </div>
                <input
                  type="email"
                  placeholder="admin@wedrink.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] ml-1">
                Security Key
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-slate-400 w-5 h-5 group-focus-within:text-teal-600 transition-colors" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-4 rounded-xl border border-red-100"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-teal-500/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Access Portal</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="h-px w-12 bg-slate-100" />
            <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Need assistance? <button type="button" className="text-teal-600 hover:text-teal-700 transition-colors">Contact IT Support</button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
