import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import axios from 'axios';

const authOptions = {
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
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ account, user }: any) {
      // Fetch guilds and attach to user for JWT callback
      if (account?.access_token) {
        try {
          const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          user.guilds = guildsRes.data.map((g: any) => g.id);
        } catch (e) {
          user.guilds = [];
        }
      }
      return true;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user = {
          ...session.user,
          email: token.email,
          name: token.name,
          image: token.picture,
          guilds: token.guilds,
        };
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (user && user.guilds) {
        token.guilds = user.guilds;
      }
      if (account && user) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions }; 