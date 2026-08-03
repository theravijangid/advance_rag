import { createLogger, format, transports } from 'winston'

// Now you can use these imported features directly
const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console(), new transports.File({ filename: 'error.log', level: 'error' })],
})

export default logger
