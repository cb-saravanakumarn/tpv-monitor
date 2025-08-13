// src/controllers/authController.ts
import { Request, Response } from "express";
import { GoogleOAuthService } from "../services/googleOAuthService";

export class AuthController {
  private oauthService: GoogleOAuthService;

  constructor() {
    this.oauthService = GoogleOAuthService.getInstance();
  }

  public beginOAuth = (req: Request, res: Response): void => {
    try {
      const url = this.oauthService.generateAuthUrl();
      res.json({ success: true, url });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || "Failed to generate auth URL",
      });
    }
  };

  public handleOAuthCallback = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { code } = req.query as any;
      if (!code) {
        res
          .status(400)
          .json({ success: false, error: "Missing 'code' query param" });
        return;
      }
      await this.oauthService.handleOAuthCallback(code);
      res.json({ success: true, message: "OAuth successful. Tokens stored." });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || "OAuth callback failed",
      });
    }
  };

  public status = (req: Request, res: Response): void => {
    res.json({ success: true, authorized: this.oauthService.isAuthorized() });
  };

  public revoke = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.oauthService.revoke();
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: error?.message || "Failed to revoke" });
    }
  };
}
