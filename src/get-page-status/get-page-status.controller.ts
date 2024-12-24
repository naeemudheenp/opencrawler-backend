import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('get-page-status')
export class GetPageStatusController {
  @Get()
  async fetchUrl(@Query('url') url: string, @Res() res: Response) {
    let response;
    try {
      response = await fetch(url);
      res.status(200).json({
        status: 200,
        text: await response.text(),
      });
    } catch (error) {
      res.status(404).json({
        status: 404,
      });
    }
  }
}
