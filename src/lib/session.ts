import { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  role: "student" | "admin" | "teacher";
  name: string;
  email: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "gate_prep_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};
