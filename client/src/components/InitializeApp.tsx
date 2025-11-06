import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const InitializeApp = ({ children }: { children: React.ReactNode }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Call the init-admin edge function to create default admin
        const { data, error } = await supabase.functions.invoke("init-admin");

        if (error) {
          console.error("Failed to initialize admin:", error);
        } else {
          console.log("Admin initialization:", data);
        }
      } catch (error) {
        console.error("Error initializing admin:", error);
      }

      setInitialized(true);
    };

    initializeApp();
  }, []);

  if (!initialized) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};
