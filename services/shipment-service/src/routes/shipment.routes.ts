import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
  res.json({ message: "Shipment created" });
});

export default router;
