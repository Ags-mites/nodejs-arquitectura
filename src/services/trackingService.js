export default {
  TrackingService: {
    TrackingPortType: {
      trackPackage(args, callback) {
        const trackingNumber = args.trackingNumber;
        const response = `Paquete con número ${trackingNumber} está en tránsito.`;
        callback({ result: response });
      }
    }
  }
};
