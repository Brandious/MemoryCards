import { Socket } from 'socket.io';
import { Lobby } from '../lobby/lobby';

import { ServerEvents } from '@shared/server/ServerEvents';

export type AuthenticatedSocket = Socket & {
  data: {
    lobby: null | Lobby;
  };

  emit: <T>(ev: ServerEvents, data: T) => boolean;
};
