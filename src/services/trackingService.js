import { prisma } from "../prisma/client";
import { TrackingError } from "../models/trackingError";

export default {
  async getTrackingStatus(trackingNumber) {
    if (!trackingNumber || typeof trackingNumber !== 'string')
      //throw TrackingError.requiredField('trackingNumber')
      throw new Error('Error')

    //todo cambiar a uuid
    const re = /^PE\d{10}$/;
    if (!re.test(trackingNumber)) {
      throw TrackingError.invalidTrackingNumber(trackingNumber);
    }

    const pkg = await prisma.package.findUnique({
      where: { trackingNumber },
      include: {
        history: {
          ordorderBy: { date: 'asc' }
        }
      }
    })

    if (!pkg) {
      return {
        error: {
          errorCode: 404,
          errorMessage: 'Tracking no encontrado',
          invalidField: 'trackingNumber'
        }
      };
      throw new Error('paquete no existe')
    }

    return {
      status: pkg.status,
      currentLocation: pkg.currentLocation,
      estimatedDeliveryDate: pkg.estimatedDeliveryDate
        ? pkg.estimatedDeliveryDate.toISOString().split('T')[0]
        : null,
      history: {
        event: pkg.history.map(evt => ({
          date: evt.date.toISOString(),
          description: evt.description,
          location: evt.location
        }))
      }
    }
  }
};
