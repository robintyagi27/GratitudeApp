const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "protos", "entries.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const entriesProto = grpc.loadPackageDefinition(packageDefinition).entries;

const ENTRIES_ADDR = process.env.ENTRIES_SERVICE_ADDR || "entries-cluster-ip-service:50051";
const entriesClient = new entriesProto.Entries(ENTRIES_ADDR, grpc.credentials.createInsecure());

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/healthz", (req, res) => res.send({ ok: true }));

// REST facade for Gratitude entries
app.get("/entries/all", (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit || "50", 10) || 50);
  entriesClient.ListEntries({ limit }, (err, result) => {
    if (err) return res.status(500).send({ error: err.message });
    // Keep client compatibility shape: { rows: [...] }
    res.send({ rows: (result.entries || []).map((e) => ({ id: e.id, text: e.text, created_at: e.created_at })) });
  });
});

app.post("/entries", (req, res) => {
  const text = (req.body && req.body.text ? String(req.body.text) : "").trim();
  entriesClient.CreateEntry({ text }, (err, entry) => {
    if (err) return res.status(400).send({ ok: false, error: err.message });
    res.send({ ok: true, entry });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway listening on :${PORT}`));
