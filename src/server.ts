// src/server.ts
import express, { Application } from "express";
import cors from "cors";
import { config, validateEnvironment } from "./config/environment";
import sheetsRoutes from "./routes/sheetsRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

class Server {
  private app: Application;
  private port: number | string;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.use("/", sheetsRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
    this.app.use(notFoundHandler);
  }

  public start(): void {
    try {
      validateEnvironment();

      this.app.listen(this.port, () => {
        console.log(`🚀 Server is running on port ${this.port}`);
        console.log(`📊 Access the API at http://localhost:${this.port}`);
        console.log(`🌍 Environment: ${config.nodeEnv}`);
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }
}

const server = new Server();
server.start();

export default server;
