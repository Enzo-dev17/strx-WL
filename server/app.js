const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;
const WEB_DIR = path.resolve(__dirname, "../web");
const INDEX_FILE = path.resolve(WEB_DIR, "index.html");
const IMAGE_DIR = path.resolve(__dirname, "../sync/images");

// Mets ici le vrai chemin de ton inventaire
const INVENTORY_PATH = "C:/fxserver/resources/[ox]/ox_inventory/web/images";

console.log("WEB_DIR =", WEB_DIR);
console.log("INDEX_FILE =", INDEX_FILE);
console.log("IMAGE_DIR =", IMAGE_DIR);
console.log("INDEX exists =", fs.existsSync(INDEX_FILE));
console.log("IMAGE_DIR exists =", fs.existsSync(IMAGE_DIR));

// Log de toutes les requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Sert les images
app.use("/images", express.static(IMAGE_DIR));

// API test
app.get("/api/test", (req, res) => {
    res.json({
        ok: true,
        message: "API OK",
        webDir: WEB_DIR,
        indexFile: INDEX_FILE,
        imageDir: IMAGE_DIR,
        indexExists: fs.existsSync(INDEX_FILE),
        imageDirExists: fs.existsSync(IMAGE_DIR),
    });
});

// API images
app.get("/api/images", (req, res) => {
    try {
        if (!fs.existsSync(IMAGE_DIR)) {
            return res.status(404).json({ error: "Dossier images introuvable", path: IMAGE_DIR });
        }

        const files = fs.readdirSync(IMAGE_DIR);

        const images = files
            .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
            .map((file, index) => ({
                id: index + 1,
                name: path.parse(file).name,
                file
            }));

        res.json(images);
    } catch (error) {
        console.error("Erreur /api/images :", error);
        res.status(500).json({ error: "Impossible de lire les images" });
    }
});

// API sync
app.post("/api/sync", (req, res) => {
    try {
        if (!fs.existsSync(IMAGE_DIR)) {
            return res.status(404).json({ error: "Dossier source introuvable", path: IMAGE_DIR });
        }

        if (!fs.existsSync(INVENTORY_PATH)) {
            return res.status(404).json({ error: "Dossier inventaire introuvable", path: INVENTORY_PATH });
        }

        const files = fs.readdirSync(IMAGE_DIR)
            .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));

        for (const file of files) {
            const src = path.join(IMAGE_DIR, file);
            const dest = path.join(INVENTORY_PATH, file);
            fs.copyFileSync(src, dest);
        }

        res.json({ success: true, count: files.length });
    } catch (error) {
        console.error("Erreur /api/sync :", error);
        res.status(500).json({ error: "Impossible de synchroniser les images" });
    }
});

// Route principale
app.get("/", (req, res) => {
    if (!fs.existsSync(INDEX_FILE)) {
        return res.status(404).send(`index.html introuvable : ${INDEX_FILE}`);
    }

    res.sendFile(INDEX_FILE);
});

// 404
app.use((req, res) => {
    res.status(404).send(`Route introuvable : ${req.method} ${req.url}`);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server lancé");
});