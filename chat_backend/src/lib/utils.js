import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    path: "/",
    httpOnly: true, // prevent XSS attacks
    sameSite: "lax", // CSRF attacks
    secure: false, // production အတွက်မှသာ true ဖြစ်စေရန်
  });

  res.header("Access-Control-Allow-Credentials", "true");

  return token;
};
