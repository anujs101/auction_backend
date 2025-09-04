import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { walletAuthService } from '@/services/wallet-auth.service';
import { roomService } from './rooms.service';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';
import { 
  AuthenticatedSocket, 
  SocketAuthPayload, 
  SocketEventMessage,
  BidUpdateMessage,
  SupplyUpdateMessage,
  TimeslotUpdateMessage,
  UserNotificationMessage
} from '@/types/websocket.types';
import { AppError, AuthenticationError } from '@/utils/errors';

export class SocketService {
  private io: SocketIOServer;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();
  private walletToSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.NODE_ENV === 'production' 
          ? process.env.WEBSOCKET_CORS_ORIGIN?.split(',') || false
          : true,
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6
    });
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupInterval();

    logger.info('WebSocket service initialized', {
      environment: env.NODE_ENV,
      cors: env.NODE_ENV === 'production' ? 'restricted' : 'open'
    });
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        const authPayload: SocketAuthPayload = {
          token: socket.handshake.auth?.token || socket.handshake.query?.token as string,
          walletAddress: socket.handshake.auth?.walletAddress || socket.handshake.query?.walletAddress as string
        };

        // Allow unauthenticated connections to join public rooms
        if (!authPayload.token) {
          logger.info('Unauthenticated WebSocket connection', {
            socketId: socket.id,
            ip: socket.handshake.address
          });
          next();
          return;
        }

        // Validate JWT token
        const user = await walletAuthService.validateToken(authPayload.token);
        
        // Create authenticated socket
        const authenticatedSocket: AuthenticatedSocket = {
          id: socket.id,
          user: {
            ...user,
            updatedAt: new Date() // Add missing updatedAt field
          },
          walletAddress: user.walletAddress,
          rooms: new Set(),
          lastActivity: new Date()
        };

        this.authenticatedSockets.set(socket.id, authenticatedSocket);
        
        // Track wallet connections
        if (!this.walletToSockets.has(user.walletAddress)) {
          this.walletToSockets.set(user.walletAddress, new Set());
        }
        this.walletToSockets.get(user.walletAddress)!.add(socket.id);

        // Attach user to socket for easy access
        (socket as any).user = user;
        (socket as any).walletAddress = user.walletAddress;

        logger.info('Authenticated WebSocket connection', {
          socketId: socket.id,
          userId: user.id,
          walletAddress: user.walletAddress.substring(0, 8) + '...'
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(new AuthenticationError('WebSocket authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    const authenticatedSocket = this.authenticatedSockets.get(socket.id);
    
    if (authenticatedSocket) {
      roomService.onUserConnect(authenticatedSocket);
      
      // Auto-join authenticated users to their wallet room
      roomService.createWalletRoom(authenticatedSocket.walletAddress);
      this.joinRoom(socket.id, `wallet:${authenticatedSocket.walletAddress}`);
      
      // Auto-join to authenticated room
      this.joinRoom(socket.id, 'authenticated');
    } else {
      // Unauthenticated users can only join global room
      this.joinRoom(socket.id, 'global');
    }

    // Setup socket event handlers
    this.setupSocketEvents(socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    logger.info('WebSocket connection established', {
      socketId: socket.id,
      authenticated: !!authenticatedSocket,
      totalConnections: this.io.sockets.sockets.size
    });
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketEvents(socket: Socket): void {
    const authenticatedSocket = this.authenticatedSockets.get(socket.id);

    // Join room event
    socket.on('join_room', async (roomName: string) => {
      try {
        if (authenticatedSocket) {
          await roomService.joinRoom(socket.id, roomName, authenticatedSocket);
          socket.join(roomName);
          socket.emit('room_joined', { room: roomName, success: true });
        } else {
          socket.emit('room_join_error', { error: 'Authentication required' });
        }
      } catch (error) {
        socket.emit('room_join_error', { 
          error: error instanceof Error ? error.message : 'Failed to join room' 
        });
      }
    });

    // Leave room event
    socket.on('leave_room', async (roomName: string) => {
      try {
        if (authenticatedSocket) {
          await roomService.leaveRoom(socket.id, roomName, authenticatedSocket);
          socket.leave(roomName);
          socket.emit('room_left', { room: roomName, success: true });
        }
      } catch (error) {
        socket.emit('room_leave_error', { 
          error: error instanceof Error ? error.message : 'Failed to leave room' 
        });
      }
    });

    // Join timeslot room
    socket.on('join_timeslot', async (timeslotId: string) => {
      try {
        if (!authenticatedSocket) {
          socket.emit('timeslot_join_error', { error: 'Authentication required' });
          return;
        }

        roomService.createTimeslotRoom(timeslotId);
        await roomService.joinRoom(socket.id, `timeslot:${timeslotId}`, authenticatedSocket);
        socket.join(`timeslot:${timeslotId}`);
        
        socket.emit('timeslot_joined', { timeslotId, success: true });
        
        logger.info('User joined timeslot room', {
          socketId: socket.id,
          timeslotId,
          walletAddress: authenticatedSocket.walletAddress
        });
      } catch (error) {
        socket.emit('timeslot_join_error', { 
          error: error instanceof Error ? error.message : 'Failed to join timeslot' 
        });
      }
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      if (authenticatedSocket) {
        authenticatedSocket.lastActivity = new Date();
      }
      socket.emit('pong');
    });

    // Get connection stats (admin only)
    socket.on('get_stats', () => {
      if (authenticatedSocket && this.isAdmin(authenticatedSocket.walletAddress)) {
        const stats = roomService.getConnectionStats();
        socket.emit('connection_stats', stats);
      } else {
        socket.emit('stats_error', { error: 'Admin access required' });
      }
    });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: Socket): void {
    const authenticatedSocket = this.authenticatedSockets.get(socket.id);
    
    if (authenticatedSocket) {
      // Remove from wallet tracking
      const walletSockets = this.walletToSockets.get(authenticatedSocket.walletAddress);
      if (walletSockets) {
        walletSockets.delete(socket.id);
        if (walletSockets.size === 0) {
          this.walletToSockets.delete(authenticatedSocket.walletAddress);
        }
      }

      // Leave all rooms
      roomService.leaveAllRooms(socket.id, authenticatedSocket);
      
      // Remove from authenticated sockets
      this.authenticatedSockets.delete(socket.id);
    }

    logger.info('WebSocket connection closed', {
      socketId: socket.id,
      authenticated: !!authenticatedSocket,
      totalConnections: this.io.sockets.sockets.size - 1
    });
  }

  /**
   * Join a room (internal method)
   */
  private joinRoom(socketId: string, roomName: string): void {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(roomName);
    }
  }

  /**
   * Broadcast bid update to relevant rooms
   */
  broadcastBidUpdate(message: BidUpdateMessage): void {
    // Broadcast to timeslot room
    this.io.to(`timeslot:${message.data.timeslotId}`).emit('bid_update', message);
    
    // Broadcast to user's wallet room
    this.broadcastToWallet(message.data.userId, message);
    
    // Broadcast to authenticated users
    this.io.to('authenticated').emit('bid_update', message);

    logger.info('Broadcast bid update', {
      type: message.type,
      bidId: message.data.bidId,
      timeslotId: message.data.timeslotId
    });
  }

  /**
   * Broadcast supply update to relevant rooms
   */
  broadcastSupplyUpdate(message: SupplyUpdateMessage): void {
    // Broadcast to timeslot room
    this.io.to(`timeslot:${message.data.timeslotId}`).emit('supply_update', message);
    
    // Broadcast to user's wallet room
    this.broadcastToWallet(message.data.userId, message);
    
    // Broadcast to authenticated users
    this.io.to('authenticated').emit('supply_update', message);

    logger.info('Broadcast supply update', {
      type: message.type,
      supplyId: message.data.supplyId,
      timeslotId: message.data.timeslotId
    });
  }

  /**
   * Broadcast timeslot update to relevant rooms
   */
  broadcastTimeslotUpdate(message: TimeslotUpdateMessage): void {
    // Broadcast to timeslot room
    this.io.to(`timeslot:${message.data.timeslotId}`).emit('timeslot_update', message);
    
    // Broadcast to all authenticated users
    this.io.to('authenticated').emit('timeslot_update', message);

    logger.info('Broadcast timeslot update', {
      type: message.type,
      timeslotId: message.data.timeslotId
    });
  }

  /**
   * Send notification to specific wallet
   */
  sendWalletNotification(walletAddress: string, message: UserNotificationMessage): void {
    this.io.to(`wallet:${walletAddress}`).emit('user_notification', message);

    logger.info('Sent wallet notification', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      type: message.type,
      level: message.data.level
    });
  }

  /**
   * Broadcast to wallet by user ID
   */
  private async broadcastToWallet(userId: string, message: SocketEventMessage): Promise<void> {
    // Find wallet address for user ID
    for (const [socketId, authSocket] of this.authenticatedSockets.entries()) {
      if (authSocket.user.id === userId) {
        this.io.to(`wallet:${authSocket.walletAddress}`).emit('user_update', message);
        break;
      }
    }
  }

  /**
   * Check if wallet has admin privileges
   */
  private isAdmin(walletAddress: string): boolean {
    const adminWallets = process.env.ADMIN_WALLETS?.split(',') || [];
    return adminWallets.includes(walletAddress);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      ...roomService.getConnectionStats(),
      authenticatedSockets: this.authenticatedSockets.size,
      walletConnections: this.walletToSockets.size
    };
  }

  /**
   * Start cleanup interval for inactive connections
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveConnections();
      roomService.cleanupEmptyRooms();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up inactive connections
   */
  private cleanupInactiveConnections(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, authSocket] of this.authenticatedSockets.entries()) {
      if (now.getTime() - authSocket.lastActivity.getTime() > inactiveThreshold) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          logger.info('Disconnected inactive socket', {
            socketId,
            walletAddress: authSocket.walletAddress,
            lastActivity: authSocket.lastActivity
          });
        }
      }
    }
  }

  /**
   * Get Socket.IO server instance
   */
  getServer(): SocketIOServer {
    return this.io;
  }
}

export let socketService: SocketService;

export const initializeSocketService = (httpServer: HttpServer): SocketService => {
  socketService = new SocketService(httpServer);
  return socketService;
};
