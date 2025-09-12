import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactTicketDto, UpdateTicketStatusDto, CreateTicketResponseDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Public endpoint for creating contact tickets
  @Post('tickets')
  async createTicket(@Body() data: CreateContactTicketDto, @Req() req: any) {
    // Add IP address and user agent from request
    const ticketData = {
      ...data,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    return this.contactService.createTicket(ticketData);
  }

  // Admin endpoints for managing tickets
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('tickets')
  async getTickets(@Query() query: any) {
    return this.contactService.getTickets(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('tickets/:id')
  async getTicketById(@Param('id') id: string) {
    return this.contactService.getTicketById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('tickets/:id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() data: UpdateTicketStatusDto
  ) {
    return this.contactService.updateTicketStatus(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('tickets/:id/responses')
  async addResponse(
    @Param('id') ticketId: string,
    @Body() data: CreateTicketResponseDto,
    @Req() req: any
  ) {
    return this.contactService.addResponse(ticketId, data, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('stats')
  async getTicketStats() {
    return this.contactService.getTicketStats();
  }
}
