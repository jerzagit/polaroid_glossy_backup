import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

// Dynamic auth options that work with any domain
const getAuthOptions = (req?: NextRequest): NextAuthOptions => ({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create or update user in database
      try {
        await db.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.name,
            avatar: user.image,
          },
          create: {
            email: user.email!,
            name: user.name,
            avatar: user.image,
          },
        });
      } catch (error) {
        console.error("Error saving user to database:", error);
      }
      return true;
    },
    async session({ session, user, token }) {
      // Get user from database and add id to session
      if (session.user?.email) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: session.user.email },
          });
          if (dbUser) {
            session.user.id = dbUser.id;
          }
        } catch (error) {
          console.error("Error fetching user from database:", error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
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
  // Use relative URLs for callbacks - this makes it work on any domain
  debug: process.env.NODE_ENV === 'development',
});

const handler = NextAuth(getAuthOptions);
export { handler as GET, handler as POST };
