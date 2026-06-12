import { useState, useEffect } from "react";
import { getToken, isAuthenticated } from "./api";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  return { authenticated, token: getToken() };
}