const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

// ⚠️ YAHAN APNA TOKEN DAAL
const TOKEN = "Bearer KUHN-RSOG-QZBV-4R0P";

app.use(express.static("public"));

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    console.log("File received:", req.file.originalname);

    // STEP 1: Get server
    const srv = await fetch("https://filemirage.com/api/servers", {
      headers: { Authorization: TOKEN }
    });

    const srvData = await srv.json();

    if (!srvData.success) {
      throw new Error("Failed to get server");
    }

    const server = srvData.data.server;
    const uploadId = srvData.data.upload_id;

    console.log("Server:", server);

    // STEP 2: Upload file
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path));
    form.append("upload_id", uploadId);
    form.append("chunk_number", 0);
    form.append("total_chunks", 1);
    form.append("filename", req.file.originalname);

    const uploadRes = await fetch(server + "/upload.php", {
      method: "POST",
      headers: {
        Authorization: TOKEN
      },
      body: form
    });

    const result = await uploadRes.json();

    console.log("Upload result:", result);

    // temp file delete
    fs.unlinkSync(req.file.path);

    if (!result.success) {
      return res.status(500).send("Upload failed");
    }

    res.json({
      url: result.data.url
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Server error");
  }
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});