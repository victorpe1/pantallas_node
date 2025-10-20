import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../db.js";

const router = express.Router();

// ✅ Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const productos = await db.collection("productos").find().toArray();
    res.json(productos);
  } catch (e) {
    res.status(500).json({ error: "Error al obtener productos", detalle: e.toString() });
  }
});

// ✅ Crear producto
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const data = req.body;
    const result = await db.collection("productos").insertOne(data);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (e) {
    res.status(500).json({ success: false, error: e.toString() });
  }
});

// ✅ Editar producto
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    const data = req.body;
    await db
      .collection("productos")
      .updateOne({ _id: new ObjectId(id) }, { $set: data });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.toString() });
  }
});

// ✅ Eliminar producto
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    await db.collection("productos").deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.toString() });
  }
});

export default router;
