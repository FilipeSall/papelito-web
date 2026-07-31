import { gql } from "@apollo/client";

export const CATEGORIES_QUERY = gql`
  query Categories {
    productCategories(first: 100, where: { hideEmpty: false }) {
      nodes {
        id
        databaseId
        name
        slug
        count
        parentDatabaseId
      }
    }
  }
`;
