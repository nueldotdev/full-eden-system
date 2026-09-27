const { dbAdmin } = require("../utils/supabase");


const handleSync = async (req, res) => {
  const { data: rule } = await dbAdmin
    .from('rules')
    .select()
    .eq('active', true)
    .maybeSingle();

  const { data: people } = await dbAdmin
    .from('people')
    .select();

  res.json({ rule: rule ?? null, people: people ?? [] });
};


module.exports = {
  handleSync
};