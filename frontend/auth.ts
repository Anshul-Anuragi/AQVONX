import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// List of super-admin emails that have access to /admin
const ADMIN_EMAILS = [
  "developer@aqvonx.com",
  // Add your primary Google account email here
];

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
        const isAdmin = ADMIN_EMAILS.includes(email);
        const namePart = email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

        return {
          id: `usr_${Buffer.from(email).toString("hex").slice(0, 16)}`,
          email: email,
          name: formattedName,
          role: isAdmin ? "admin" : "user",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error custom role from user object
        token.role = user.role || (ADMIN_EMAILS.includes(user.email || "") ? "admin" : "user");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        // @ts-expect-error adding custom role attribute
        session.user.role = token.role || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
