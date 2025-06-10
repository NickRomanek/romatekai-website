import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Account, User as NextAuthUser, Profile } from "next-auth"; // Import necessary types

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
      profile,
    }: {
      user: NextAuthUser; // Use NextAuthUser type for 'user'
      account: Account | null;
      profile?: Profile;
    }) {
      if (!user.email) {
        return false;
      }
      // Allow both admin@romatekai.com and nromanek33@gmail.com
      return ["admin@romatekai.com", "nromanek33@gmail.com"].includes(
        user.email
      );
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };