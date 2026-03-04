import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('tasks').select('due_date').limit(1);
  console.log("Error:", error?.message);
  console.log("Data:", data);
}
test();
