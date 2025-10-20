import express from "express";
import { connectDB } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const compras = await db.collection("compras").find().sort({ fecha: -1 }).toArray();

    res.json(compras);
  } catch (e) {
    console.error("Error al obtener compras:", e);
    res.status(500).json({
      error: "Error al obtener compras",
      detalle: e.toString(),
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const compras = db.collection("compras");
    const productos = db.collection("productos");

    const { productoId, cantidad, precioUnitario, proveedor, notas } = req.body;
    const productoObjectId = new ObjectId(productoId);

    const fecha = new Date().toISOString();
    const total = cantidad * precioUnitario;

    // 🔹 Guardar la compra
    await compras.insertOne({
      producto_id: productoObjectId,
      fecha,
      cantidad,
      precio_unitario: precioUnitario,
      total,
      proveedor: proveedor || "",
      notas: notas || "",
    });

    // 🔹 Actualizar el stock y precios del producto
    const producto = await productos.findOne({ _id: productoObjectId });
    if (producto) {
      const nuevoStock = (producto.stock ?? 0) + cantidad;
      const precioMinimo =
        producto.precio_minimo == null
          ? precioUnitario
          : Math.min(precioUnitario, producto.precio_minimo);

      await productos.updateOne(
        { _id: productoObjectId },
        {
          $set: {
            stock: nuevoStock,
            precio_ultimo: precioUnitario,
            precio_minimo: precioMinimo,
          },
        }
      );
    }

    res.json({ success: true, mensaje: "Compra registrada correctamente" });
  } catch (error) {
    console.error("Error en /api/compras:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;