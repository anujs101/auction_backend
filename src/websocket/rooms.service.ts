import { logger } from '@/utils/logger';
import { AuthenticatedSocket, RoomConfig, ConnectionStats } from '@/types/websocket.types';
import { AppError } from '@/utils/errors';

export class RoomService {
  private rooms: Map<string, Set<string>> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();
  private roomConfigs: Map<string, RoomConfig> = new Map();
  private connectionStats: ConnectionStats = {
    totalConnections: 0,
    authenticatedConnections: 0,
    roomConnections: {},
    walletConnections: {}
  };

  constructor() {
    this.initializeDefaultRooms();
  }

  /**
   * Initialize default room configurations
   */
  private initializeDefaultRooms(): void {
    const defaultRooms: RoomConfig[] = [
      {
        name: 'global',
        requiresAuth: false,
        walletRestricted: false,
        adminOnly: false,
        maxConnections: 1000
      },
      {
        name: 'authenticated',
        requiresAuth: true,
        walletRestricted: false,
        adminOnly: false,
        maxConnections: 500
      },
      {
        name: 'admin',
        requiresAuth: true,
        walletRestricted: false,
        adminOnly: true,
        maxConnections: 50
      }
    ];

    defaultRooms.forEach(room => {
      this.roomConfigs.set(room.name, room);
      this.rooms.set(room.name, new Set());
      this.connectionStats.roomConnections[room.name] = 0;
    });

    logger.info('Default WebSocket rooms initialized', {
      rooms: defaultRooms.map(r => r.name)
    });
  }

  /**
   * Join user to a room with wallet-based authorization
   */
  async joinRoom(socketId: string, roomName: string, socket: AuthenticatedSocket): Promise<void> {
    try {
      const roomConfig = this.roomConfigs.get(roomName);
      
      if (!roomConfig) {
        throw new AppError(`Room ${roomName} does not exist`, 404);
      }

      // Check authentication requirements
      if (roomConfig.requiresAuth && !socket.user) {
        throw new AppError('Authentication required for this room', 401);
      }

      // Check admin requirements
      if (roomConfig.adminOnly && !this.isAdmin(socket.user?.walletAddress)) {
        throw new AppError('Admin access required for this room', 403);
      }

      // Check room capacity
      const currentConnections = this.rooms.get(roomName)?.size || 0;
      if (roomConfig.maxConnections && currentConnections >= roomConfig.maxConnections) {
        throw new AppError('Room is at maximum capacity', 429);
      }

      // Add to room
      if (!this.rooms.has(roomName)) {
        this.rooms.set(roomName, new Set());
      }
      
      this.rooms.get(roomName)!.add(socketId);
      
      // Track user rooms
      if (!this.userRooms.has(socketId)) {
        this.userRooms.set(socketId, new Set());
      }
      this.userRooms.get(socketId)!.add(roomName);
      
      // Update socket rooms
      socket.rooms.add(roomName);
      
      // Update stats
      this.connectionStats.roomConnections[roomName] = this.rooms.get(roomName)!.size;
      
      if (socket.user) {
        this.connectionStats.walletConnections[socket.walletAddress] = 
          (this.connectionStats.walletConnections[socket.walletAddress] || 0) + 1;
      }

      logger.info('User joined room', {
        socketId,
        roomName,
        walletAddress: socket.walletAddress,
        roomSize: this.rooms.get(roomName)!.size
      });

    } catch (error) {
      logger.error('Failed to join room', {
        socketId,
        roomName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Remove user from a room
   */
  async leaveRoom(socketId: string, roomName: string, socket: AuthenticatedSocket): Promise<void> {
    try {
      const room = this.rooms.get(roomName);
      if (room) {
        room.delete(socketId);
        this.connectionStats.roomConnections[roomName] = room.size;
      }

      const userRoomSet = this.userRooms.get(socketId);
      if (userRoomSet) {
        userRoomSet.delete(roomName);
      }

      socket.rooms.delete(roomName);

      if (socket.user) {
        const walletConnections = this.connectionStats.walletConnections[socket.walletAddress] || 0;
        this.connectionStats.walletConnections[socket.walletAddress] = Math.max(0, walletConnections - 1);
      }

      logger.info('User left room', {
        socketId,
        roomName,
        walletAddress: socket.walletAddress,
        roomSize: room?.size || 0
      });

    } catch (error) {
      logger.error('Failed to leave room', {
        socketId,
        roomName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Remove user from all rooms (on disconnect)
   */
  async leaveAllRooms(socketId: string, socket: AuthenticatedSocket): Promise<void> {
    const userRoomSet = this.userRooms.get(socketId);
    if (userRoomSet) {
      for (const roomName of userRoomSet) {
        await this.leaveRoom(socketId, roomName, socket);
      }
      this.userRooms.delete(socketId);
    }

    // Update total connections
    this.connectionStats.totalConnections = Math.max(0, this.connectionStats.totalConnections - 1);
    if (socket.user) {
      this.connectionStats.authenticatedConnections = Math.max(0, this.connectionStats.authenticatedConnections - 1);
    }

    logger.info('User disconnected from all rooms', {
      socketId,
      walletAddress: socket.walletAddress
    });
  }

  /**
   * Get all socket IDs in a room
   */
  getRoomMembers(roomName: string): string[] {
    const room = this.rooms.get(roomName);
    return room ? Array.from(room) : [];
  }

  /**
   * Get all rooms a user is in
   */
  getUserRooms(socketId: string): string[] {
    const userRoomSet = this.userRooms.get(socketId);
    return userRoomSet ? Array.from(userRoomSet) : [];
  }

  /**
   * Create a timeslot-specific room
   */
  createTimeslotRoom(timeslotId: string): void {
    const roomName = `timeslot:${timeslotId}`;
    
    if (!this.roomConfigs.has(roomName)) {
      const roomConfig: RoomConfig = {
        name: roomName,
        requiresAuth: true,
        walletRestricted: false,
        adminOnly: false,
        maxConnections: 200
      };
      
      this.roomConfigs.set(roomName, roomConfig);
      this.rooms.set(roomName, new Set());
      this.connectionStats.roomConnections[roomName] = 0;
      
      logger.info('Created timeslot room', { timeslotId, roomName });
    }
  }

  /**
   * Create a wallet-specific room for private notifications
   */
  createWalletRoom(walletAddress: string): void {
    const roomName = `wallet:${walletAddress}`;
    
    if (!this.roomConfigs.has(roomName)) {
      const roomConfig: RoomConfig = {
        name: roomName,
        requiresAuth: true,
        walletRestricted: true,
        adminOnly: false,
        maxConnections: 5 // Multiple devices per wallet
      };
      
      this.roomConfigs.set(roomName, roomConfig);
      this.rooms.set(roomName, new Set());
      this.connectionStats.roomConnections[roomName] = 0;
      
      logger.info('Created wallet room', { walletAddress, roomName });
    }
  }

  /**
   * Check if wallet address has admin privileges
   */
  private isAdmin(walletAddress?: string): boolean {
    if (!walletAddress) return false;
    
    // Production-grade admin wallet checking using environment configuration
    const adminWallets = process.env.ADMIN_WALLETS?.split(',').map(addr => addr.trim()) || [];
    return adminWallets.includes(walletAddress);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  /**
   * Get room configuration
   */
  getRoomConfig(roomName: string): RoomConfig | undefined {
    return this.roomConfigs.get(roomName);
  }

  /**
   * Update connection stats when user connects
   */
  onUserConnect(socket: AuthenticatedSocket): void {
    this.connectionStats.totalConnections++;
    if (socket.user) {
      this.connectionStats.authenticatedConnections++;
    }
  }

  /**
   * Clean up inactive rooms
   */
  cleanupEmptyRooms(): void {
    for (const [roomName, room] of this.rooms.entries()) {
      if (room.size === 0 && roomName.startsWith('timeslot:')) {
        this.rooms.delete(roomName);
        this.roomConfigs.delete(roomName);
        delete this.connectionStats.roomConnections[roomName];
        
        logger.info('Cleaned up empty timeslot room', { roomName });
      }
    }
  }
}

export const roomService = new RoomService();
