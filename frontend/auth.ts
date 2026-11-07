import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

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
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email as string | undefined;
        if (!rawEmail || !rawEmail.includes("@")) {
          return null;
        }

        const email = rawEmail.trim().toLowerCase();

        // AUTH-1 / AUTH-3: Super-admin accounts are blocked from unverified credentials fallback.
        // Super-admin access requires Google OAuth with mandatory 2FA.
        if (ADMIN_EMAILS.includes(email)) {
          return null;
        }

        const namePart = email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        return {
          id: `usr_${Buffer.from(email).toString("hex").slice(0, 16)}`,
          email: email,
          name: formattedName,
          role: "user",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Admin role is strictly restricted to verified Google OAuth accounts in ADMIN_EMAILS
        const isGoogleAuth = account?.provider === "google";
        const email = (user.email || token.email || "").toLowerCase();
        const isAdmin = isGoogleAuth && ADMIN_EMAILS.includes(email);

        token.role = isAdmin ? "admin" : "user";
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
