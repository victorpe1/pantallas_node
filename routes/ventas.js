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

router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const ventas = db.collection("ventas");
    const productos = db.collection("productos");

    const { desde, hasta, q } = req.query;
    const filtro = {};

    // 🔸 Filtro por rango de fechas
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde).toISOString();
      if (hasta) filtro.fecha.$lte = new Date(hasta).toISOString();
    }

    // 🔸 Filtro por texto (cliente o notas)
    if (q) {
      filtro.$or = [
        { cliente: { $regex: q, $options: "i" } },
        { notas: { $regex: q, $options: "i" } },
      ];
    }

    const lista = await ventas.find(filtro).sort({ fecha: -1 }).toArray();

    // 🔸 Mapear nombres de productos
    const productosMap = {};
    const prods = await productos.find().toArray();
    prods.forEach((p) => (productosMap[p._id.toString()] = p.nombre));

    const ventasConNombre = lista.map((v) => ({
      _id: v._id,
      producto_id: v.producto_id,
      producto_nombre: productosMap[v.producto_id?.toString()] ?? "Desconocido",
      fecha: v.fecha,
      cantidad: v.cantidad,
      precio_unitario: v.precio_unitario,
      total: v.total,
      costo_unitario: v.costo_unitario,
      ganancia: v.ganancia,
      cliente: v.cliente ?? "",
      notas: v.notas ?? "",
    }));

    res.json(ventasConNombre);
  } catch (error) {
    console.error("Error en GET /api/ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas", detalle: error.message });
  }
});


export default router;
