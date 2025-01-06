import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";

export function createToken(userId: string) {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "24h" });
}

export function verifyToken(token: string): {
  valid: boolean;
  expired: boolean;
  decoded: JwtPayload | null;
} {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    return { valid: true, expired: false, decoded };
  } catch (error: any) {
    return {
      valid: false,
      expired: error.message.includes("jwt expired"),
      decoded: null,
    };
  }
}
