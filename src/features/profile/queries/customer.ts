import { gql } from "@apollo/client";

export const CUSTOMER_QUERY = gql`
  query Customer {
    customer {
      id
      databaseId
      email
      firstName
      lastName
      billing {
        firstName
        lastName
        city
        state
        postcode
        email
        phone
      }
      shipping {
        city
        state
        postcode
      }
    }
  }
`;
