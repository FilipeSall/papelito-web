import { gql } from "@apollo/client";

export const PRODUCTS_QUERY = gql`
  query Products(
    $first: Int = 60
    $after: String
    $categoryIn: [String]
    $minPrice: Float
    $maxPrice: Float
  ) {
    products(
      first: $first
      after: $after
      where: {
        status: "publish"
        categoryIn: $categoryIn
        minPrice: $minPrice
        maxPrice: $maxPrice
      }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        __typename
        id
        databaseId
        name
        slug
        description
        shortDescription
        image {
          sourceUrl
          altText
        }
        galleryImages {
          nodes {
            sourceUrl
            altText
          }
        }
        productCategories(first: 20) {
          nodes {
            id
            databaseId
            name
            slug
            count
            parentDatabaseId
          }
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
          stockStatus
          sku
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
          stockStatus
          sku
        }
      }
    }
  }
`;

export const PRODUCT_QUERY = gql`
  query Product($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      __typename
      id
      databaseId
      name
      slug
      description
      shortDescription
      image {
        sourceUrl
        altText
      }
      galleryImages {
        nodes {
          sourceUrl
          altText
        }
      }
      productCategories(first: 20) {
        nodes {
          id
          databaseId
          name
          slug
          count
          parentDatabaseId
        }
      }
      ... on SimpleProduct {
        price
        regularPrice
        salePrice
        stockStatus
        sku
      }
      ... on VariableProduct {
        price
        regularPrice
        salePrice
        stockStatus
        sku
      }
    }
  }
`;
