import express, { Request, Response } from "express";

const app = express();
const port: number = parseInt(process.env.PORT || "3000", 10);

// Middleware to parse JSON
app.use(express.json());

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to TPV Monitor!",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(port, () => {
  console.log(`TPV Monitor app listening on port ${port}`);
  console.log(`Visit http://localhost:${port} to see the app running`);
});
