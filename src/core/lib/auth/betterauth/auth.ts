import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { nextCookies } from "better-auth/next-js";

// Check for required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set in environment variables");
}

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL is not set in environment variables");
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN is not set in environment variables");
}

// Initialize the database dialect
const dialect = new LibsqlDialect({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize the auth server
export const auth = betterAuth({
  database: {
    dialect,
    type: "sqlite"
  },
  emailAndPassword: {
    enabled: true,
    // You can customize these options
    autoSignIn: true, // Auto sign in after sign up
    verifyEmail: true, // Require email verification
    minimumPasswordLength: 8,
  },
  socialProviders: {
    // Add your social providers here
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()]
}); 