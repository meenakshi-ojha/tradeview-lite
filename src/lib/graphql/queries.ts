import { gql } from "@apollo/client";

export const GET_QUOTES = gql`
  query GetQuotes($symbols: [String!]!, $mode: DataMode!) {
    quotes(symbols: $symbols, mode: $mode) {
      symbol
      price
      change
      changePercent
      updatedAt
      stale
      error
    }
  }
`;

export const GET_HISTORY = gql`
  query GetHistory($symbol: String!, $mode: DataMode!, $range: HistoryRange!) {
    history(symbol: $symbol, mode: $mode, range: $range) {
      timestamp
      price
    }
  }
`;

export const GET_NEWS = gql`
  query GetNews {
    news {
      id
      headline
      source
      publishedAt
      relatedSymbol
    }
  }
`;
