import { check, param, query } from 'express-validator';

export class Validator {
  public static getTokenValidator = [
    param('type').isIn(['video', 'chat']),
    query('room').custom((room: string, { req }) => {
      if (req.params.type === 'chat') {
        return true;
      }
      return room !== null && room.length > 0;
    })
  ];
  public static channelIdValidator = [
    check('requester').exists(),
    check('invited').exists()
  ];
}
