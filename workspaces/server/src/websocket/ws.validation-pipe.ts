import { ServerException } from '@app/game/server.exception';
import { Injectable, ValidationPipe } from '@nestjs/common';

import { SocketExceptions } from '@shared/server/SocketExceptions';

@Injectable()
export class WsValidationPipe extends ValidationPipe {
  createExceptionFactory() {
    return (validationErrors = []) => {
      if (this.isDetailedOutputDisabled) {
        return new ServerException(
          SocketExceptions.UnexpectedError,
          'Bad request',
        );
      }

      const errors = this.flattenValidationErrors(validationErrors);

      return new ServerException(SocketExceptions.UnexpectedError, errors);
    };
  }
}
