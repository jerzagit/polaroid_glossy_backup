import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await db.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.name,
            avatar: user.image,
          },
          create: {
            supabaseId: (account?.providerAccountId || user.email || "").toString(),
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
    async session({ session, token }) {
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
    async jwt({ token, user }) {
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
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
