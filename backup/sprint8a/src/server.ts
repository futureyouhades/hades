import express from "express";
import cors from "cors";
import path from "node:path";
import { HadesCommander } from "./commander/index.js";

const app = express();
const commander = new HadesCommander();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(process.cwd(), "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body?.message ?? "");

    const answer = await commander.execute(message);

    res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      answer: "Błąd HADES.",
    });
  }
});

const PORT = 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("==================================");
  console.log("🚀 HADES ONLINE");
  console.log("==================================");
  console.log(`http://localhost:${PORT}`);
  console.log("");
});
