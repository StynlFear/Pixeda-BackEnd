import crypto from "crypto";
import { Employee } from "../../models/employee/employee.model.js";
import { Session } from "../../models/auth/session.model.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";

// helper pt. cookie flags
function cookieOpts(days = 30) {
  const prod = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: false,        // false for localhost
    sameSite: "lax",      // Changed from "none" to "lax" for localhost
    path: "/",
    maxAge: days * 24 * 60 * 60 * 1000
    // Remove domain completely to allow cross-origin
  };
}
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// LOGIN
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await Employee.findOne({ email }).select("+password").lean(false);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken  = signAccessToken({ sub: user._id.toString(), role: user.position, email: user.email });
    const refreshToken = signRefreshToken({ sub: user._id.toString(), token: crypto.randomUUID() }); // jti-like

    // stocăm DOAR hash-ul refresh token-ului
    const decoded = verifyRefreshToken(refreshToken);
    await Session.create({
      user: user._id,
      tokenHash: sha256(refreshToken),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(decoded.exp * 1000)
    });

    res.cookie("rt", refreshToken, cookieOpts(30));
    const safeUser = {
      _id: user._id, firstName: user.firstName, lastName: user.lastName,
      email: user.email, phone: user.phone, position: user.position, hireDate: user.hireDate,
      createdAt: user.createdAt, updatedAt: user.updatedAt
    };
    return res.json({ accessToken, user: safeUser });
  } catch (err) { next(err); }
}

// REFRESH (rotație și revocare vechi)
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.rt;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const payload = verifyRefreshToken(token);
    const tokenHash = sha256(token);
    const session = await Session.findOne({ user: payload.sub, tokenHash, revokedAt: null });
    if (!session) return res.status(401).json({ message: "Invalid session" });
    if (new Date() > session.expiresAt) return res.status(401).json({ message: "Session expired" });

    // GET USER DATA - This is what's missing!
    const user = await Employee.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "User not found" });

    // rotim refresh token-ul (replay protection)
    session.revokedAt = new Date();
    await session.save();


// Create new access token with actual user data
const accessToken = signAccessToken({ 
  sub: user._id.toString(), 
  role: user.position,
  email: user.email
});
    
    const newRefresh = signRefreshToken({ sub: payload.sub, token: crypto.randomUUID() });
    const decodedNew = verifyRefreshToken(newRefresh);

    await Session.create({
      user: payload.sub,
      tokenHash: sha256(newRefresh),
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: new Date(decodedNew.exp * 1000)
    });

    res.cookie("rt", newRefresh, cookieOpts(30));
    return res.json({ accessToken });
  } catch (err) { return res.status(401).json({ message: "Invalid refresh token" }); }
}

// LOGOUT
export async function logout(req, res, next) {
  try {
    const token = req.cookies?.rt;
    if (token) {
      const tokenHash = sha256(token);
      await Session.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
    res.clearCookie("rt", { path: "/" });
    return res.json({ ok: true });
  } catch (err) { next(err); }
}

// ME (din access token)
export async function me(req, res) {
  res.json({ user: req.user });
}
