import express from "express";
import { connectDB } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const db = await connectDB();

    const user = await db.collection("usuarios").findOne({ usuario, password });

    if (!user) {
      return res.status(401).json({
        success: false,
        mensaje: "Usuario o contraseña incorrecta",
      });
    }

    // devolvemos datos básicos
    res.json({
      success: true,
      mensaje: `Login correcto para ${user.nombre}`,
      usuario: {
        id: user._id,
        nombre: user.nombre,
        rol: user.rol,
        usuario: user.usuario,
      },
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      mensaje: "Error al conectarse a la base de datos",
      error: e.toString(),
    });
  }
});

export default router;
