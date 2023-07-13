"use client";
import { createContext } from "react";
import { useSetRecoilState } from "recoil";
import SocketState from "./SocketState";
import SocketManager from "./SocketManager";

const socketManager = new SocketManager();

export const SocketManagerContext = createContext(socketManager);

type ProviderProps = {
  children: React.ReactNode;
};

export function SocketManagerProvider({ children }: ProviderProps) {
  socketManager.setSocketState = useSetRecoilState(SocketState);
  console.log(socketManager);
  return (
    <SocketManagerContext.Provider value={socketManager}>
      {children}
    </SocketManagerContext.Provider>
  );
}
