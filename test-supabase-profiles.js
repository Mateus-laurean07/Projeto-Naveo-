import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = env.match(/PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from("profiles").select("*");
  console.log("Profiles:", data);
  const { data: inv, error: invErr } = await supabase.from("invitations").select("*");
  console.log("Invitations:", inv);
}
run();
