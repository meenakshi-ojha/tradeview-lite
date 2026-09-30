import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import type { NextRequest } from "next/server";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";

// Mounted as a Next.js App Router Route Handler (not a standalone serverless
// function). This matters: resolvers run inside Next's request lifecycle,
// so `fetch(url, { next: { revalidate } })` inside them actually hits the
// Next.js Data Cache instead of being silently ignored.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

// Thin wrappers matching Next 16's typed route handler signature exactly -
// the integration's own overloaded type is too generic for the stricter
// validator, so wrap rather than export the handler directly.
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
