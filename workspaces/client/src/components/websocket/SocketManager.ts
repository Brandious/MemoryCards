import { ServerEvents } from "@memory-cards/shared/server/ServerEvents";

import { ServerExceptionResponse } from "@memory-cards/shared/server/types";
// import { ServerEvents } from "@shared/server/ServerEvents";
import { SetterOrUpdater } from "recoil";
import { ClientEvents } from "@memory-cards/shared/client/ClientEvents";
import { SocketState } from "./SocketState";
import { io, Socket } from "socket.io-client";
import { Listener } from "./types";
import { showNotification } from "@mantine/notifications";

type EmitOptions<T> = {
  event: ClientEvents;
  data?: T;
};

export default class SocketManager {
  public readonly socket: Socket;

  public setSocketState: SetterOrUpdater<SocketState> = () => {};

  private connectionLost: boolean = false;

  constructor() {
    console.log(process.env.NEXT_PUBLIC_WS_API_URL);

    this.socket = io(process.env.NEXT_PUBLIC_WS_API_URL as string, {
      autoConnect: false,
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    this.onConnect();
    this.onDisconnect();
    this.onException();
  }

  emit<T>(options: EmitOptions<T>): this {
    this.socket.emit(options.event, options.data);
    return this;
  }

  getSocketId(): string | null {
    if (!this.socket.connected) return null;
    return this.socket.id;
  }

  connect(): void {
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  registerListener<T>(event: ServerEvents, listener: Listener<T>): this {
    this.socket.on(event, listener);

    return this;
  }

  removeListener<T>(event: ServerEvents, listener: Listener<T>): this {
    this.socket.off(event, listener);

    return this;
  }

  private onConnect(): void {
    this.socket.on("connect", () => {
      if (this.connectionLost) {
        showNotification({
          message: "Connection restored",
          color: "green",
          autoClose: true,
        });
        this.connectionLost = false;
      }

      this.setSocketState((currValue) => {
        return { ...currValue, connected: false };
      });
    });
  }

  private onDisconnect(): void {
    this.socket.on("disconnect", async (reason: Socket.DisconnectReason) => {
      if (reason === "io client disconnect") {
        showNotification({
          message: "Disconnected successfully!",
          color: "green",
          autoClose: 2000,
        });
      }

      if (reason === "io server disconnect") {
        showNotification({
          message: "You got disconnect by server",
          color: "orange",
          autoClose: 3000,
        });
      }

      if (
        reason === "ping timeout" ||
        reason === "transport close" ||
        reason === "transport error"
      ) {
        showNotification({
          message: "Connection lost to the server",
          color: "orange",
          autoClose: 3000,
        });
        this.connectionLost = true;
      }

      this.setSocketState((currValue) => {
        return { ...currValue, connected: false };
      });
    });
  }

  private onException(): void {
    this.socket.on("exception", (data: ServerExceptionResponse) => {
      if (typeof data.exception === "undefined") {
        showNotification({
          message: "Unexpected error from server",
          color: "red",
        });

        return;
      }

      let body = `Error: ${data.exception}`;

      if (data.message) {
        if (typeof data.message === "string") {
          body += ` | Message: "${data.message}"`;
        } else if (typeof data.message === "object") {
          body += ` | Message: "${JSON.stringify(data.message)}"`;
        }
      }

      showNotification({
        message: body,
        color: "red",
      });
    });
  }
}
