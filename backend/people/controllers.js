// backend/people/controllers.js
const { createClient } = require("@supabase/supabase-js"); // was missing entirely

const dbAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const dbClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

const handleGetPeople = async (req, res) => {
  try {
    const { data, error } = await dbClient.from("people").select("*");
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handleAddPeople = async (req, res) => {
  const { id, name, descriptors } = req.body;

  if (!id || !name || !Array.isArray(descriptors) || descriptors.length === 0) {
    return res.status(400).json({ message: "Missing id, name, or descriptors" });
  }

  try {
    const { data, error } = await dbAdmin
      .from("people")
      .insert({ id, name, descriptors })
      .select();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { handleGetPeople, handleAddPeople };