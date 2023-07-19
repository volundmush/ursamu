import jwt from "jsonwebtoken";

export const sign = (payload: any): Promise<string | void> =>
  new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.JWT_SECRET || "TotallyNotSoSecure",
      { expiresIn: "1h" },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    );
  });

export const verify = (token: string) =>
  new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET || "TotallyNotSoSecure",
      (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      }
    );
  });
