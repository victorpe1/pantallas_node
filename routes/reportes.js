import express from "express";
import { connectDB } from "../db.js";

const router = express.Router();

// ✅ Obtener resumen general de ventas y compras
router.get("/resumen", async (req, res) => {
  try {
    const db = await connectDB();
    const ventas = db.collection("ventas");
    const compras = db.collection("compras");
    const productos = db.collection("productos");

    // 📅 Fechas de rango
    const desde = req.query.desde
      ? new Date(req.query.desde)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hasta = req.query.hasta ? new Date(req.query.hasta) : new Date();

    // 🧾 Obtener datos
    const ventasLista = await ventas
      .find({
        fecha: { $gte: desde.toISOString(), $lte: hasta.toISOString() },
      })
      .toArray();

    const comprasLista = await compras
      .find({
        fecha: { $gte: desde.toISOString(), $lte: hasta.toISOString() },
      })
      .toArray();

    const productosLista = await productos.find().toArray();

    // 💰 Totales
    const totalVentas = ventasLista.reduce(
      (a, v) => a + (v.total ?? 0),
      0
    );
    const totalCompras = comprasLista.reduce(
      (a, c) => a + (c.total ?? 0),
      0
    );
    const gananciaTotal = ventasLista.reduce(
      (a, v) => a + (v.ganancia ?? 0),
      0
    );
    const stockTotal = productosLista.reduce(
      (a, p) => a + (p.stock ?? 0),
      0
    );

    // 📊 Agrupar por día
    const ventasPorDia = {};
    const comprasPorDia = {};

    for (const v of ventasLista) {
      const fecha = new Date(v.fecha).toISOString().substring(0, 10);
      ventasPorDia[fecha] = (ventasPorDia[fecha] ?? 0) + (v.total ?? 0);
    }

    for (const c of comprasLista) {
      const fecha = new Date(c.fecha).toISOString().substring(0, 10);
      comprasPorDia[fecha] = (comprasPorDia[fecha] ?? 0) + (c.total ?? 0);
    }

    const fechas = new Set([
      ...Object.keys(ventasPorDia),
      ...Object.keys(comprasPorDia),
    ]);

    const dataDiaria = Array.from(fechas)
      .sort()
      .map((f) => ({
        fecha: f,
        ventas: ventasPorDia[f] ?? 0,
        compras: comprasPorDia[f] ?? 0,
        ganancia: (ventasPorDia[f] ?? 0) - (comprasPorDia[f] ?? 0),
      }));

    // 📦 Respuesta
    res.json({
      ventas: totalVentas,
      compras: totalCompras,
      ganancia: gananciaTotal,
      stock: stockTotal,
      dataDiaria,
    });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Error al obtener resumen", detalle: e.toString() });
  }
});

export default router;
