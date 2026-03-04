import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseUrl = 'https://ihgpueepsmtsuzlcrkrs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3B1ZWVwc210c3V6bGNya3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTQzNTgsImV4cCI6MjA4NzI3MDM1OH0.0RWhY3KJjf12E8NuZEJTwnntz5OrGww1cqSxBJwcQe0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('leads').insert({
    name: "Teste",
    company: "Empresa Teste",
    value: "100",
    stage: "Novo Lead",
    tags: ["Teste"],
    // need user_id as well typically, but let's see why it fails
  }).select();
  console.log("Error:", error);
}
test();
