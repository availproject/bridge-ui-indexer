export const handleResponse = ({
  res,
  data,
  statusCode = 200,
}) => {
  res.status(statusCode).send(data);
}

export const handleInvalidEndpoint = ({
  res,
  statusCode = 404,
  errMsg = 'Not Found',
  err = 'Endpoint Not found',
}) => {
  res.status(statusCode).send({
    success: false,
    error: {
      message: err instanceof Error ? err.message : errMsg || err,
    },
  });
}

export const handleBadRequest = ({
  res,
  statusCode = 400,
  errMsg = 'Bad Request',
  err = 'Bad Request',
}) => {
  res.status(statusCode).send({
    success: false,
    error: {
      message: err instanceof Error ? err.message : errMsg || err,
    },
  });
}

export const handleError = ({
  res,
  statusCode = 500,
  errMsg = 'Something went wrong while computing',
  err = 'error',
}) => {
  res.status(statusCode).send({
    success: false,
    error: {
      message: err instanceof Error ? err.message : errMsg || err,
    },
  });
}
