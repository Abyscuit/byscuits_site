import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds',
          redirect_uri: process.env.NEXTAUTH_URL + '/api/auth/callback/discord',
        },
      },
    }),
  ],
  // You can add more NextAuth config here (callbacks, session, etc.)
  callbacks: {
    async signIn(params: any) {
      // eslint-disable-next-line no-console
      console.log('SignIn:\n', params.user, params.account, params.profile, params.email, params.credentials);
      return true;
    },
    // @ts-expect-error NextAuth callback param typing
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 