import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import axios from 'axios';

const GUILD_ID = '1257795491232616629';

const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.members.read',
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
        // Fetch roles in the Da Byscuits guild using access token
        try {
          const memberRes = await axios.get(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          user.guildRoles = memberRes.data.roles;
        } catch (e) {
          user.guildRoles = [];
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
          guildRoles: token.guildRoles,
        };
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (user && user.guilds) {
        token.guilds = user.guilds;
      }
      if (user && user.guildRoles) {
        token.guildRoles = user.guildRoles;
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