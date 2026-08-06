import { gql } from "@apollo/client";

export const PRODUCTS_QUERY = gql`
  query Products(
    $first: Int = 60
    $after: String
    $categoryIn: [String]
    $include: [Int]
    $minPrice: Float
    $maxPrice: Float
  ) {
    products(
      first: $first
      after: $after
      where: {
        status: "publish"
        categoryIn: $categoryIn
        include: $include
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
          weight
          length
          width
          height
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
          stockStatus
          sku
          weight
          length
          width
          height
          variations(first: 20) {
            nodes {
              ... on ProductVariation {
                weight
                length
                width
                height
              }
            }
          }
        }
      }
    }
  }
`;

export const PRODUCTS_LIST_QUERY = gql`
  query ProductsList(
    $first: Int = 60
    $after: String
    $categoryIn: [String]
    $include: [Int]
    $minPrice: Float
    $maxPrice: Float
  ) {
    products(
      first: $first
      after: $after
      where: {
        status: "publish"
        categoryIn: $categoryIn
        include: $include
        minPrice: $minPrice
        maxPrice: $maxPrice
        orderby: [{ field: DATE, order: DESC }]
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
        image {
          sourceUrl
          altText
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
          weight
          length
          width
          height
        }
        ... on VariableProduct {
          price
          regularPrice
          salePrice
          weight
          length
          width
          height
          variations(first: 20) {
            nodes {
              ... on ProductVariation {
                weight
                length
                width
                height
              }
            }
          }
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
        weight
        length
        width
        height
      }
      ... on VariableProduct {
        price
        regularPrice
        salePrice
        stockStatus
        sku
        weight
        length
        width
        height
        variations(first: 20) {
          nodes {
            ... on ProductVariation {
              weight
              length
              width
              height
            }
          }
        }
      }
    }
  }
`;
