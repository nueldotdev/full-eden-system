const { createClient } = require("@supabase/supabase-js");


const dbAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

const dbClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
);

module.exports = {
  dbAdmin,
  dbClient
};