import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Application } from "./Application";
import { Login } from "./Login";
import { Register } from "./Register";
import { Toaster } from "sonner";

export function AppRoot() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [inactiveMessage, setInactiveMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Check localStorage in case of rapid kickout
    const handleStorage = () => {
      const reason = localStorage.getItem("kicked_out_reason");
      if (reason) {
        setInactiveMessage(reason);
        localStorage.removeItem("kicked_out_reason");
      }
    };
    handleStorage();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
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
          <Login 
            onGoToRegister={() => setAuthView("register")} 
            externalError={inactiveMessage}
          />
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
      <Application session={session} />
    </>
  );
}
