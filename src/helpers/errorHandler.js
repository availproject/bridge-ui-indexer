import { InfoError } from './errorHelper.js';
import { handleError, handleBadRequest } from './responseHandlers.js';

export default class ErrorHandler {
  static handleControllerError(
    error,
    res,
    errorMessage
  ) {
    if (error instanceof InfoError) {
      console.log(errorMessage, error);
      handleBadRequest({ res, err: error });

      return;
    }

    console.error(errorMessage, error);
    handleError({ res, err: error });
  }
}
