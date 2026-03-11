import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = env.match(/PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url, key);

async function createInvite() {
  const { error } = await supabase.from("invitations").insert({
    email: "test_auto_join@naveo.com.br",
    invited_by: "59475617-8baa-4270-a132-f06fc8cc596d",
    role: "user",
    status: "pending",
  });
  console.log("Create invite error:", error);
}

async function register() {
  console.log("Registering...");

  // same logic
  const { data: invData, error: invError } = await supabase
    .from("invitations")
    .select("role, avatar_url, invited_by")
    .eq("email", "test_auto_join@naveo.com.br")
    .eq("status", "pending")
    .maybeSingle();

  console.log("Found invite", invData);

  const { data: authData, error } = await supabase.auth.signUp({
    email: "test_auto_join@naveo.com.br",
    password: "Password123!",
    options: {
      data: {
        full_name: "Test Join",
        role: invData?.role || "user",
        admin_id: invData?.invited_by || null,
      },
    },
  });

  console.log("SignUp error:", error);
  if (authData?.user) {
    console.log("User created:", authData.user.id);
  }
}

async function run() {
  await createInvite();
  await register();
}

run();
