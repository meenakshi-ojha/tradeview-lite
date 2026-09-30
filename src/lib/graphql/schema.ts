export const typeDefs = `#graphql
  enum DataMode {
    MOCK
    REAL
  }

  enum HistoryRange {
    WEEK
    MONTH
    QUARTER
    YEAR
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

  type CandlePoint {
    timestamp: String!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
  }

  type NewsItem {
    id: ID!
    headline: String!
    source: String!
    publishedAt: String!
    relatedSymbol: String
  }

  type Query {
    quotes(symbols: [String!]!, mode: DataMode = MOCK): [Quote!]!
    history(symbol: String!, mode: DataMode = MOCK, range: HistoryRange = MONTH): [PricePoint!]!
    candles(symbol: String!, range: HistoryRange = MONTH): [CandlePoint!]!
    news: [NewsItem!]!
  }
`;
