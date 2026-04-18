const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

// ⚠️ TOKEN (better: env variable use kar)
const TOKEN = "Bearer KUHN-RSOG-QZBV-4R0P";

// STATIC FILES
app.use(express.static("public"));


// ✅ ROOT ROUTE (YAHAN hona chahiye — bahar)
app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});


// ✅ UPLOAD ROUTE
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    console.log("File received:", req.file.originalname);

    // STEP 1
    const srv = await fetch("https://filemirage.com/api/servers", {
      headers: { Authorization: TOKEN }
    });

    const srvData = await srv.json();

    if (!srvData.success) {
      throw new Error("Failed to get server");
    }

    const server = srvData.data.server;
    const uploadId = srvData.data.upload_id;

    // STEP 2
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    form.append("upload_id", uploadId);
    form.append("chunk_number", 0);
    form.append("total_chunks", 1);
    form.append("filename", req.file.originalname);

    const uploadRes = await fetch(server + "/upload.php", {
      method: "POST",
      headers: { Authorization: TOKEN },
      body: form
    });

    const result = await uploadRes.json();

    fs.unlinkSync(req.file.path);

    if (!result.success) {
      return res.status(500).send("Upload failed");
    }

    res.json({ url: result.data.url });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Server error");
  }
});


// ⚠️ PORT FIX (Railway ke liye)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
