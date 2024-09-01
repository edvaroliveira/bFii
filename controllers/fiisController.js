const { fetchFiisData } = require("../services/fiisService");

const getFiisData = async (req, res) => {
  try {
    const fiisData = await fetchFiisData();
    res.json(fiisData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch FIIs data" });
  }
};

module.exports = { getFiisData };
