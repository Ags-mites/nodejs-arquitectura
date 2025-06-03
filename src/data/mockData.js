import moment from 'moment';

/**
* Datos de prueba para el sistema de tracking
* Simula una base de datos con paquetes y su historial
*/
const mockData = {
    packages: [
        {
            trackingNumber: "PE1234567890",
            senderName: "María González",
            receiverName: "Carlos López",
            origin: "Lima",
            destination: "Arequipa",
            weight: 2.5,
            dimensions: "30x20x15",
            status: "En tránsito",
            currentLocation: "Lima - Perú",
            estimatedDeliveryDate: "2025-06-05",
            history: [
                {
                    date: moment().subtract(5, 'days').toDate(),
                    description: "Paquete recibido en oficina de origen",
                    location: "Lima - Centro de Distribución"
                },
                {
                    date: moment().subtract(4, 'days').toDate(),
                    description: "Paquete procesado y clasificado",
                    location: "Lima - Centro de Distribución"
                },
                {
                    date: moment().subtract(3, 'days').toDate(),
                    description: "Salida hacia destino",
                    location: "Lima - Terminal de Carga"
                },
                {
                    date: moment().subtract(1, 'day').toDate(),
                    description: "En tránsito hacia Arequipa",
                    location: "En ruta"
                }
            ]
        },
        {
            trackingNumber: "PE0987654321",
            senderName: "Ana Martínez",
            receiverName: "Pedro Ramírez",
            origin: "Cusco",
            destination: "Lima",
            weight: 1.2,
            dimensions: "25x15x10",
            status: "Entregado",
            currentLocation: "Lima - Oficina de Destino",
            estimatedDeliveryDate: "2025-05-30",
            history: [
                {
                    date: moment().subtract(7, 'days').toDate(),
                    description: "Paquete recibido en oficina de origen",
                    location: "Cusco - Centro de Distribución"
                },
                {
                    date: moment().subtract(6, 'days').toDate(),
                    description: "Paquete procesado y clasificado",
                    location: "Cusco - Centro de Distribución"
                },
                {
                    date: moment().subtract(5, 'days').toDate(),
                    description: "Salida hacia Lima",
                    location: "Cusco - Terminal de Carga"
                },
                {
                    date: moment().subtract(3, 'days').toDate(),
                    description: "Llegada a Lima",
                    location: "Lima - Centro de Distribución"
                },
                {
                    date: moment().subtract(2, 'days').toDate(),
                    description: "En reparto",
                    location: "Lima - Zona de Reparto"
                },
                {
                    date: moment().subtract(1, 'day').toDate(),
                    description: "Entregado exitosamente",
                    location: "Lima - Domicilio del destinatario"
                }
            ]
        },
        {
            trackingNumber: "PE1111111111",
            senderName: "José Silva",
            receiverName: "Laura Torres",
            origin: "Trujillo",
            destination: "Chiclayo",
            weight: 3.8,
            dimensions: "40x30x20",
            status: "Pendiente de recolección",
            currentLocation: "Trujillo - Oficina de Origen",
            estimatedDeliveryDate: "2025-06-10",
            history: [
                {
                    date: moment().subtract(1, 'day').toDate(),
                    description: "Paquete registrado en el sistema",
                    location: "Trujillo - Centro de Distribución"
                },
                {
                    date: moment().toDate(),
                    description: "Pendiente de recolección por el remitente",
                    location: "Trujillo - Centro de Distribución"
                }
            ]
        },
        {
            trackingNumber: "PE2222222222",
            senderName: "Roberto Díaz",
            receiverName: "Carmen Vega",
            origin: "Piura",
            destination: "Lima",
            weight: 0.8,
            dimensions: "20x15x5",
            status: "En proceso de clasificación",
            currentLocation: "Piura - Centro de Distribución",
            estimatedDeliveryDate: "2025-06-08",
            history: [
                {
                    date: moment().subtract(2, 'days').toDate(),
                    description: "Paquete recibido en oficina de origen",
                    location: "Piura - Centro de Distribución"
                },
                {
                    date: moment().subtract(1, 'day').toDate(),
                    description: "Verificación de datos del destinatario",
                    location: "Piura - Centro de Distribución"
                },
                {
                    date: moment().toDate(),
                    description: "En proceso de clasificación",
                    location: "Piura - Centro de Distribución"
                }
            ]
        },
        {
            trackingNumber: "PE3333333333",
            senderName: "Elena Morales",
            receiverName: "Diego Castillo",
            origin: "Lima",
            destination: "Iquitos",
            weight: 5.2,
            dimensions: "50x40x30",
            status: "Retenido en aduana",
            currentLocation: "Lima - Aduana Internacional",
            estimatedDeliveryDate: "2025-06-15",
            history: [
                {
                    date: moment().subtract(8, 'days').toDate(),
                    description: "Paquete recibido en oficina de origen",
                    location: "Lima - Centro de Distribución"
                },
                {
                    date: moment().subtract(7, 'days').toDate(),
                    description: "Procesado para envío internacional",
                    location: "Lima - Centro de Distribución"
                },
                {
                    date: moment().subtract(5, 'days').toDate(),
                    description: "Enviado a revisión aduanera",
                    location: "Lima - Aduana Internacional"
                },
                {
                    date: moment().subtract(2, 'days').toDate(),
                    description: "Retenido para verificación de documentos",
                    location: "Lima - Aduana Internacional"
                }
            ]
        },
        {
            trackingNumber: "PE4444444444",
            senderName: "Fernando Rojas",
            receiverName: "Isabel Guerrero",
            origin: "Arequipa",
            destination: "Tacna",
            weight: 1.5,
            dimensions: "30x25x8",
            status: "Devuelto al remitente",
            currentLocation: "Arequipa - Centro de Distribución",
            estimatedDeliveryDate: null,
            history: [
                {
                    date: moment().subtract(10, 'days').toDate(),
                    description: "Paquete recibido en oficina de origen",
                    location: "Arequipa - Centro de Distribución"
                },
                {
                    date: moment().subtract(8, 'days').toDate(),
                    description: "Salida hacia Tacna",
                    location: "Arequipa - Terminal de Carga"
                },
                {
                    date: moment().subtract(6, 'days').toDate(),
                    description: "Llegada a Tacna",
                    location: "Tacna - Centro de Distribución"
                },
                {
                    date: moment().subtract(4, 'days').toDate(),
                    description: "Intento de entrega fallido - Destinatario no encontrado",
                    location: "Tacna - Zona de Reparto"
                },
                {
                    date: moment().subtract(3, 'days').toDate(),
                    description: "Segundo intento de entrega fallido",
                    location: "Tacna - Zona de Reparto"
                },
                {
                    date: moment().subtract(1, 'day').toDate(),
                    description: "Devuelto al remitente por falta de contacto",
                    location: "Arequipa - Centro de Distribución"
                }
            ]
        }
    ],

    /**
     * Estados posibles de los paquetes
     */
    packageStatuses: [
        "Pendiente de recolección",
        "En proceso de clasificación",
        "En tránsito",
        "En reparto",
        "Entregado",
        "Retenido en aduana",
        "Devuelto al remitente",
        "Extraviado"
    ],

    /**
     * Ubicaciones comunes en Perú
     */
    commonLocations: [
        "Lima - Centro de Distribución",
        "Lima - Terminal de Carga",
        "Lima - Zona de Reparto",
        "Arequipa - Centro de Distribución",
        "Cusco - Centro de Distribución",
        "Trujillo - Centro de Distribución",
        "Piura - Centro de Distribución",
        "Chiclayo - Centro de Distribución",
        "Iquitos - Centro de Distribución",
        "Tacna - Centro de Distribución",
        "Lima - Aduana Internacional"
    ]
};

module.exports = mockData;
