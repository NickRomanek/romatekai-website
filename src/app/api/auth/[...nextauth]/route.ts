import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { User } from "next-auth";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: User }) {
      // Allow both admin@romatekai.com and nromanek33@gmail.com
      return ["admin@romatekai.com", "nromanek33@gmail.com"].includes(user.email || "");
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 