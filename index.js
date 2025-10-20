import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

import productosRoutes from "./routes/productos.js";
import comprasRoutes from "./routes/compras.js";
import ventasRoutes from "./routes/ventas.js";
import reportesRoutes from "./routes/reportes.js";
import usuariosRoutes from "./routes/usuarios.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Servidor de API Pantallas funcionando correctamente");
});

app.use("/api/productos", productosRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/usuarios", usuariosRoutes);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🌐 Servidor corriendo en puerto ${PORT}`));
});