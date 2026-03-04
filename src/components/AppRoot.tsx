import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Application } from "./Application";
import { Login } from "./Login";
import { Register } from "./Register";
import { Toaster } from "sonner";

export function AppRoot() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<"login" | "register">("register");

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  if (!session) {
    if (authView === "login") {
      return (
        <>
          <Toaster position="top-right" richColors />
          <Login onGoToRegister={() => setAuthView("register")} />
        </>
      );
    }
    return (
      <>
        <Toaster position="top-right" richColors />
        <Register onGoToLogin={() => setAuthView("login")} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <Application />
    </>
  );
}
