require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fiisRoutes = require("./routes/fiis");

const app = express();

// Usar CORS
app.use(cors());

// Definir a porta a partir do .env ou usar a porta 5000 como padrão
const PORT = process.env.PORT || 5001;

app.use("/api/fiis", fiisRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
