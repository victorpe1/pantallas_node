import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../db.js";

const router = express.Router();

// ✅ Registrar una venta
router.post("/", async (req, res) => {
  try {
    const { productoId, cantidad, precioUnitario, cliente, notas } = req.body;

    if (!productoId || !cantidad || !precioUnitario) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const db = await connectDB();
    const productos = db.collection("productos");
    const ventas = db.collection("ventas");

    const productoObjectId = new ObjectId(productoId);
    const producto = await productos.findOne({ _id: productoObjectId });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const stockActual = producto.stock ?? 0;
    if (cantidad > stockActual) {
      return res
        .status(400)
        .json({ error: `Stock insuficiente (solo hay ${stockActual})` });
    }

    const precioCompra = producto.precio_ultimo ?? 0;
    const gananciaUnidad = precioUnitario - precioCompra;
    const gananciaTotal = gananciaUnidad * cantidad;
    const total = cantidad * precioUnitario;

    await ventas.insertOne({
      producto_id: productoObjectId,
      fecha: new Date().toISOString(),
      cantidad,
      precio_unitario: precioUnitario,
      total,
      costo_unitario: precioCompra,
      ganancia: gananciaTotal,
      cliente: cliente || "",
      notas: notas || "",
    });

    // Actualizar el stock del producto
    await productos.updateOne(
      { _id: productoObjectId },
      { $set: { stock: stockActual - cantidad } }
    );

    res.json({ success: true, mensaje: "✅ Venta registrada correctamente" });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Error al registrar venta", detalle: e.toString() });
  }
});

export default router;
