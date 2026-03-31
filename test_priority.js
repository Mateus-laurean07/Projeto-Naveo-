import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ihgpueepsmtsuzlcrkrs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3B1ZWVwc210c3V6bGNya3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTQzNTgsImV4cCI6MjA4NzI3MDM1OH0.0RWhY3KJjf12E8NuZEJTwnntz5OrGww1cqSxBJwcQe0'
);

async function testPriority(val) {
  const t = {
    title: "Test Task Priority", 
    priority: val, 
    project_id: null 
  };
  const { error } = await supabase.from('project_tasks').insert([t]);
  console.log(`Inserting '${val}':`, error ? "Error: " + error.message : "Success");
}

async function main() {
  await testPriority("Baixo");
  await testPriority("Baixa");
  await testPriority("Normal");
  await testPriority("Média");
  await testPriority("Alta");
  await testPriority("Baixa ");
}
main();
