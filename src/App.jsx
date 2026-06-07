// src/App.jsx
import { useState, useEffect } from "react";
import { supabase, getProfile } from "./lib/supabase";
import AuthScreen from "./AuthScreen";
import SubscriptionPage from "./SubscriptionPage";
import Wireway from "./electrical-estimator";

export default function App() {
  const [session,       setSession]       = useState(undefined);
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showPricing,   setShowPricing]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) await loadProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    // Check for subscription success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      window.history.replaceState({}, "", "/");
      setShowPricing(false);
    }

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    setLoading(true);
    const { data } = await getProfile(userId);
    setProfile(data);
    setLoading(false);
  };

  // Loading splash
  if (loading || session === undefined) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0a0c", flexDirection:"column", gap:16 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:"linear-gradient(135deg,#e8c97a,#c9a84c)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#0a0a0c", fontFamily:"sans-serif" }}>W</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:"sans-serif", letterSpacing:"0.05em" }}>Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!session) return <AuthScreen onAuth={() => {}} />;

  // Show pricing page
  if (showPricing) {
    return (
      <SubscriptionPage
        user={session.user}
        profile={profile}
        onClose={() => setShowPricing(false)}
        onUpgrade={() => setShowPricing(false)}
      />
    );
  }

  // Main app
  return (
    <Wireway
      user={session.user}
      profile={profile}
      onProfileUpdate={setProfile}
      onShowPricing={() => setShowPricing(true)}
    />
  );
}
