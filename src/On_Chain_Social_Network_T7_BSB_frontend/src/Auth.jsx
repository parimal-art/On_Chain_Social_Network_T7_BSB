import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "../../declarations/On_Chain_Social_Network_T7_BSB_backend";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [actor, setActor] = useState(null);
  const [principal, setPrincipal] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
      if (isAuthenticated) {
        handleAuthenticated(client);
      }
    };
    initAuth();
  }, []);

  const handleAuthenticated = async (client) => {
    const identity = client.getIdentity();
    setPrincipal(identity.getPrincipal());

    const host = process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app";

    // Create an agent using the identity
    const agent = new (await import("@dfinity/agent")).HttpAgent({ 
      identity,
      host,
    });

    if (process.env.DFX_NETWORK !== "ic") {
      agent.fetchRootKey().catch((err) => {
        console.warn(
          "Unable to fetch root key. Check to ensure that your local replica is running"
        );
        console.error(err);
      });
    }

    const newActor = createActor(process.env.BACKEND_CANISTER_ID, { agentOptions: { identity, host } });
    setActor(newActor);
  };

  const login = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        await authClient.login({
          identityProvider: "https://identity.ic0.app",
          onSuccess: () => {
            handleAuthenticated(authClient);
            setIsAuthenticated(true);
            resolve();
          },
          onError: (err) => {
            reject(err);
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const logout = async () => {
    await authClient.logout();
    setIsAuthenticated(false);
    setActor(null);
    setPrincipal(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, actor, principal }}
    >
      {authClient ? children : null}
    </AuthContext.Provider>
  );
};
