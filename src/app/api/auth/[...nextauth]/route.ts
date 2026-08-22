import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Admin credentials stored in env vars (ADMIN_EMAIL / ADMIN_PASSWORD)
// Falls back to bcrypt hash for flexibility

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@polaroidglossy.my" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail = process.env.ADMIN_EMAILS?.split(",")[0]?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) return null;

        const emailMatch = credentials.email.toLowerCase() === adminEmail;
        if (!emailMatch) return null;

        // Check if ADMIN_PASSWORD is a bcrypt hash or plain text
        const passwordValid = adminPassword.startsWith("$2")
          ? await bcrypt.compare(credentials.password, adminPassword)
          : credentials.password === adminPassword;

        if (!passwordValid) return null;

        return {
          id: adminEmail,
          email: adminEmail,
          name: "Admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
