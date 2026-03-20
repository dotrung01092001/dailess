import { supabase } from "./supabase.js";

export async function connectDatabase() {
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error && !error.message.toLowerCase().includes("relation")) {
    throw error;
  }
  console.log("Supabase client is ready.");
}

export async function disconnectDatabase() {
  return Promise.resolve();
}
