import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = env.match(/PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url, key);

async function run() {
  const { data: invData } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", "teste.novo@naveo.com.br")
    .eq("status", "pending")
    .maybeSingle();
  console.log("Found invite:", invData);

  const { data: authData, error } = await supabase.auth.signUp({
    email: "teste.novo@naveo.com.br",
    password: "Password123!",
    options: {
      data: {
        full_name: "Teste Novo",
        role: "user",
        admin_id: invData?.invited_by || null,
      },
    },
  });

  console.log("Signup:", authData, error);

  if (authData.user) {
    await supabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("email", "teste.novo@naveo.com.br")
      .eq("status", "pending");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", "teste.novo@naveo.com.br");
  console.log("Profiles:", data);
}
run();
