import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Use Supabase to verify the token and get the user object
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // 1. Get User ID: Attach the authenticated user's ID to the request object
    req.userId = data.user.id;

    // 2. Allow access
    next();
  } catch (error) {
    console.error("Authentication failed:", error);
    res.status(500).json({ error: "Authentication server error." });
  }
};

export default authMiddleware;
