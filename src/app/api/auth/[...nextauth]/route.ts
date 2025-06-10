import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/* ------------------------------------------------------ */
/* 1.  Auth options                                       */
/* ------------------------------------------------------ */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Narrow type: we only care that `email` might exist.
    async signIn({ user }: { user: { email?: string | null } }) {
      if (!user.email) return false;

      // Allowlist
      return ["admin@romatekai.com", "nromanek33@gmail.com"].includes(
        user.email,
      );
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

/* ------------------------------------------------------ */
/* 2.  Route handler exports                              */
/* ------------------------------------------------------ */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
