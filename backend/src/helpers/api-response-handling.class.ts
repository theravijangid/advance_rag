import express from 'express'
class ApiResponseHandler {
  /**
   * @function handleSuccessResponse
   * @param res Express response object
   * @param message Client side message
   * @param data Response payload
   */

  handleSuccessResponse(res: express.Response, message: string, data?: any) {
    const responseObject = {
      status: 200,
      message,
      data,
    }

    res.status(200).json(responseObject)
  }

  /**
   * @function handleBadRequest
   * @param res Express response object
   * @param message Client side message
   * @param errorMessage Internal use
   */

  handleBadRequest = async (res: express.Response, message: string, error?: string) => {
    res.status(400).json({
      message: message,
      error,
    })
  }

  /**
   * @function handleNotFoundRequest
   * @param res Express response object
   * @param message Client side message
   * @param errorMessage Internal use
   */

  handleNotFoundRequest = async (res: express.Response, message: string, error?: string) => {
    res.status(404).json({
      message: message,
      error,
    })
  }

  /**
   * @function handleErrorReponse
   * @description Internal Server error
   * @param res Express response object
   * @param message Client side message
   * @param errorMessage Internal use
   */
  handleErrorReponse(res: express.Response, message: string, errorMessage?: string) {
    const responseObject = {
      status: 500,
      message: message,
      error: errorMessage,
    }

    res.status(500).json(responseObject)
  }

   /**
   * @function handleUnauthorizedRequest
   * @param res Express response object
   * @param message Client side message
   * @param error Internal use
   */
   handleUnauthorizedRequest = async (res: express.Response, message: string, error?: string) => {
    res.status(401).json({
      message: message,
      error,
    })
  }

   /**
   * @function handleForbiddenRequest
   * @param res Express response object
   * @param message Client side message
   * @param error Internal use
   */
   handleForbiddenRequest = async (res: express.Response, message: string, error?: string) => {
    res.status(403).json({
      message: message,
      error,
    })
  }

   /**
   * @function handleConflict
   * @param res Express response object
   * @param message Client side message
   * @param error Internal error code/message
   */
   handleConflict = async (res: express.Response, message: string, error?: string) => {
    res.status(409).json({
      message: message,
      error,
    });
  }
}
export default new ApiResponseHandler()
