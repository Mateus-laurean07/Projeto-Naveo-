import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ihgpueepsmtsuzlcrkrs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloZ3B1ZWVwc210c3V6bGNya3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTQzNTgsImV4cCI6MjA4NzI3MDM1OH0.0RWhY3KJjf12E8NuZEJTwnntz5OrGww1cqSxBJwcQe0'
);

async function main() {
  const { data: t } = await supabase.from('tasks').select('id, title').limit(3);
  console.log("Projects (tasks table):", t);
  const { data: pt } = await supabase.from('project_tasks').select('id, title, project_id').limit(3);
  console.log("Tasks (project_tasks table):", pt);
}
main();
