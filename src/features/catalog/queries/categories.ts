import { gql } from "@apollo/client";

export const CATEGORIES_QUERY = gql`
  query Categories {
    productCategories(first: 50, where: { hideEmpty: true }) {
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
