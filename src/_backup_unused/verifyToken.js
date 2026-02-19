import { isExpired, decodeToken } from "react-jwt";

const verifyToken = function (token) {
  // Create a new data object for each call to avoid mutations
  const data = {
    status: false,
    token: "",
  };

  if (!token) {
    return data;
  }

  try {
    const decodedToken = decodeToken(token);
    const isMyTokenExpired = isExpired(token);

    // If token is expired, return false status
    if (isMyTokenExpired) {
      console.log("Token is expired");
      return data;
    }

    // Check if decoded token exists and has the right structure
    if (!decodedToken) {
      console.log("Failed to decode token");
      return data;
    }

    // Check role - allow all roles except CUSTOMER
    if (decodedToken?.role === "CUSTOMER") {
      console.log("Customer role not allowed");
      return data;
    }

    // Token is valid and role is acceptable
    data.status = true;
    data.token = decodedToken;

    return data;
  } catch (err) {
    console.error("Token verification error:", err);
    return data;
  }
};

export default verifyToken;
