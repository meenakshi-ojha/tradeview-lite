export const typeDefs = `#graphql
  enum DataMode {
    MOCK
    REAL
  }

  type Quote {
    symbol: String!
    price: Float!
    change: Float!
    changePercent: Float!
    updatedAt: String!
    stale: Boolean!
    error: String
  }

  type PricePoint {
    timestamp: String!
    price: Float!
  }

  type Query {
    quotes(symbols: [String!]!, mode: DataMode = MOCK): [Quote!]!
    history(symbol: String!, mode: DataMode = MOCK): [PricePoint!]!
  }
`;
