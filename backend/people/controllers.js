
// const data = {
//   id,
//   name,
//   descriptor_id
// }


const handleGetPeople = async (req, res) => {
  try {
    const { data, error } = await dbClient
      .from("people")
      .select("*");

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const handleAddPeople = async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const { data, error } = await dbAdmin
      .from("people")
      .insert({
        id: data.id,
        name: data.name,
        descriptors: data.descriptors
      })
      .select();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}



module.exports = {
  handleGetPeople,
  handleAddPeople
};  