import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ihgpueepsmtsuzlcrkrs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3B1ZWVwc210c3V6bGNya3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTQzNTgsImV4cCI6MjA4NzI3MDM1OH0.0RWhY3KJjf12E8NuZEJTwnntz5OrGww1cqSxBJwcQe0'
);

(async () => {
    // Get all constraint details by parsing the error? No we can't from anon endpoint.
    // Instead let's just use "Normal" in the frontend but label it "Baixa".
})();
