import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

// Verified super-admin emails that have access to /admin
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "developer@aqvonx.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "name@domain.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string | undefined;
        const rawPassword = credentials?.password as string | undefined;

        if (!rawEmail || !rawPassword || !rawEmail.includes("@")) {
          return null;
        }

        const email = rawEmail.trim().toLowerCase();

        try {
          const sql = getDb();
          const rows = await sql`
            SELECT id, email, full_name, password_hash, role, is_active, is_banned
            FROM auth_users
            WHERE LOWER(email) = LOWER(${email})
            LIMIT 1;
          `;

          if (!rows || rows.length === 0) {
            return null;
          }

          const user = rows[0];

          if (user.is_banned || !user.is_active) {
            return null;
          }

          if (!user.password_hash) {
            return null;
          }

          const isValid = await bcrypt.compare(rawPassword, user.password_hash);
          if (!isValid) {
            return null;
          }

          const isSuperAdmin = ADMIN_EMAILS.includes(email);
          const assignedRole = isSuperAdmin ? "admin" : (user.role || "user");

          return {
            id: String(user.id),
            email: String(user.email),
            name: user.full_name || email.split("@")[0],
            role: assignedRole,
          };
        } catch (error) {
          console.error("Credentials authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const email = (user.email || token.email || "").toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(email);
        let resolvedRole = isAdmin ? "admin" : (user.role || "user");

        // When logging in via Google OAuth, ensure user exists in Neon DB
        if (account?.provider === "google") {
          try {
            const sql = getDb();
            const name = user.name || email.split("@")[0];
            const rows = await sql`
              INSERT INTO auth_users (email, full_name, role, is_active, is_banned)
              VALUES (${email}, ${name}, ${resolvedRole}, TRUE, FALSE)
              ON CONFLICT (email) DO UPDATE 
              SET full_name = COALESCE(auth_users.full_name, EXCLUDED.full_name)
              RETURNING id, role;
            `;

            if (rows && rows.length > 0) {
              const dbUser = rows[0];
              token.sub = String(dbUser.id);
              resolvedRole = isAdmin ? "admin" : (dbUser.role || "user");

              // Initialize trial record in notesgpt_users
              await sql`
                INSERT INTO notesgpt_users (user_id, plan_tier, trial_start_date)
                VALUES (${dbUser.id}, 'trial', NOW())
                ON CONFLICT (user_id) DO NOTHING;
              `;
            }
          } catch (e) {
            console.error("Error synchronizing Google user in Neon:", e);
          }
        }

        token.role = resolvedRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as string) || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
