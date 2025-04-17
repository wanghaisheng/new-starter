// Auth API 层示例（可用于后端路由或前端 mock）
import { AuthService } from '../service/auth-service';
import type { Request, Response } from 'express';

const authService = new AuthService(process.env.AUTH_TYPE as any || 'mock');

export async function loginWithEmail(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const result = await authService.loginWithEmail(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
}

export async function loginWithPhone(req: Request, res: Response) {
  const { phone, code } = req.body;
  try {
    const result = await authService.loginWithPhone(phone, code);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
}

export async function loginWithProvider(req: Request, res: Response) {
  const { provider, token } = req.body;
  try {
    const result = await authService.loginWithProvider(provider, token);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
}

export async function logout(req: Request, res: Response) {
  await authService.logout();
  res.json({ ok: true });
}

export async function getCurrentUser(req: Request, res: Response) {
  const user = await authService.getCurrentUser();
  if (user) res.json(user);
  else res.status(401).json({ error: 'Not logged in' });
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const token = await authService.refreshToken();
    res.json({ token });
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
}
