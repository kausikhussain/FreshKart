import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // For development flexibility
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join order tracking room (used by both customer tracking page and driver)
    socket.on('joinOrder', (orderId: string) => {
      const room = `order_${orderId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Handle real-time driver location updates
    socket.on('driverLocationUpdate', (data: { orderId: string; lat: number; lng: number }) => {
      const { orderId, lat, lng } = data;
      // Broadcast location to all clients tracking this order (the customer)
      io.to(`order_${orderId}`).emit('locationUpdated', { lat, lng });
      console.log(`Broadcasted driver location for order ${orderId}: lat=${lat}, lng=${lng}`);
    });

    // Premium Feature: Automatic Trip Route Simulation
    // If client/driver requests a simulation, we calculate step coordinates and push updates every 2 seconds
    socket.on('startDriverSimulation', (data: { orderId: string; startLat: number; startLng: number; endLat: number; endLng: number }) => {
      const { orderId, startLat, startLng, endLat, endLng } = data;
      console.log(`Starting driver delivery simulation for order ${orderId}`);

      // Generate 15 intermediate points
      const steps = 15;
      const routePoints: Array<{ lat: number; lng: number }> = [];

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Linear interpolation
        const lat = startLat + (endLat - startLat) * t;
        const lng = startLng + (endLng - startLng) * t;
        routePoints.push({ lat, lng });
      }

      let currentStep = 0;
      const intervalId = setInterval(() => {
        if (currentStep >= routePoints.length) {
          clearInterval(intervalId);
          console.log(`Driver simulation finished for order ${orderId}`);
          return;
        }

        const point = routePoints[currentStep];
        io.to(`order_${orderId}`).emit('locationUpdated', {
          lat: point.lat,
          lng: point.lng,
          isSimulated: true
        });

        console.log(`Simulated driver update for order ${orderId} [Step ${currentStep + 1}/${steps + 1}]: lat=${point.lat}, lng=${point.lng}`);
        currentStep++;
      }, 2000); // Send coordinates every 2 seconds

      // Store interval on socket to clear on disconnect
      (socket as any).simulationIntervals = (socket as any).simulationIntervals || {};
      (socket as any).simulationIntervals[orderId] = intervalId;
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      // Clean up any running simulation intervals
      const intervals = (socket as any).simulationIntervals;
      if (intervals) {
        Object.values(intervals).forEach((intervalId) => clearInterval(intervalId as any));
      }
    });
  });

  return io;
};
