const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WEB_DIR = path.resolve(__dirname, "../web");
const INDEX_FILE = path.resolve(WEB_DIR, "index.html");
const IMAGE_DIR = path.resolve(__dirname, "../sync/images");

// Sur Render, la sync locale vers ton PC ne fonctionnera pas.
// Tu peux laisser cette variable, mais /api/sync échouera si le dossier n'existe pas.
const INVENTORY_PATH = "C:/fxserver/resources/[ox]/ox_inventory/web/images";

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/images", express.static(IMAGE_DIR));
app.use(express.static(WEB_DIR));

app.get("/", (req, res) => {
    res.sendFile(INDEX_FILE);
});

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

app.get("/api/images", (req, res) => {
    try {
        if (!fs.existsSync(IMAGE_DIR)) {
            return res.status(404).json({
                error: "Dossier images introuvable",
                path: IMAGE_DIR
            });
        }

        const files = fs.readdirSync(IMAGE_DIR);
        const imageFiles = files.filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));

        const images = imageFiles.map((file, index) => ({
            id: index + 1,
            name: path.parse(file).name,
            file
        }));

        res.json(images);
    } catch (error) {
        console.error("Erreur /api/images :", error);
        res.status(500).json({
            error: "Impossible de lire les images",
            details: String(error)
        });
    }
});

app.post("/api/sync", (req, res) => {
    try {
        if (!fs.existsSync(IMAGE_DIR)) {
            return res.status(404).json({ error: "Dossier source introuvable" });
        }

        if (!fs.existsSync(INVENTORY_PATH)) {
            return res.status(404).json({
                error: "Dossier inventaire introuvable",
                path: INVENTORY_PATH
            });
        }

        const files = fs.readdirSync(IMAGE_DIR).filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));

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

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server lancé sur le port ${PORT}`);
});
