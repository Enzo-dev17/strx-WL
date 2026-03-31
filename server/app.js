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

app.use("/images", express.static(IMAGE_DIR));
app.use(express.static(WEB_DIR));

app.get("/", (req, res) => {
    res.sendFile(INDEX_FILE);
});

app.get("/api/images", (req, res) => {
    try {
        const files = fs.readdirSync(IMAGE_DIR);
        const images = files.map((file, index) => ({
            id: index + 1,
            name: path.parse(file).name,
            file
        }));
        res.json(images);
    } catch {
        res.status(500).json({ error: "Erreur images" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server OK");
});
