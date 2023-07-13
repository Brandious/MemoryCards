import { SocketExceptions } from '@shared/server/SocketExceptions';
import { ServerExceptionResponse } from '@shared/server/types';
import { WsException } from '@nestjs/websockets';

export class ServerException extends WsException {
  constructor(type: SocketExceptions, message: string | string[]) {
    const serverExceptionResponse: ServerExceptionResponse = {
      exception: type,
      message: message,
    };

    super(serverExceptionResponse);
  }
}
