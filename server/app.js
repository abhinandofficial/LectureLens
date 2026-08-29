import express from "express";
const app = express();
app.get("/", (req, res) => res.send("LectureLens API"));
export default app;