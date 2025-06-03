const trackingService = {
  TrackingService: {
    TrackingPort: {
      TrackPackage: function(args, callback) {
        console.log('SOAP Method llamado: TrackPackage');
        console.log('Parámetros recibidos:', args);
        console.log('Tracking Number:', args.trackingNumber);

        const response = {
          status: 'En tránsito',
          location: 'Centro de distribución Quito'
        };

        console.log('Respuesta generada:', response);
        callback(null, response);
      }
    }
  }
};

export default trackingService;
