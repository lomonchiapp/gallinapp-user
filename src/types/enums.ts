/**
 * Enums para la aplicación Asoaves
 */

// Enums para autenticación
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
}

// Enums para tipos de aves
export enum TipoAve {
  PONEDORA = 'gallina_ponedora',
  POLLO_ENGORDE = 'pollos_engorde',
  POLLO_LEVANTE = 'pollos_levante',
}

// Enums para gastos
export enum CategoriaGasto {
  FEED = 'Alimento',
  MEDICATION = 'Medicacion',
  MAINTENANCE = 'Mantenimiento',
  OTHER = 'Otros',
}

// Enums para razas
export enum RazaGallina {
  COOB = 'COOB',
  W80 = 'W80',
  HYLINE_BROWN = 'HYLINE_BROWN',
  HYLINE_WHITE = 'HYLINE_WHITE',
  LOHMANN_BROWN = 'LOHMANN_BROWN',
  ISRAELI = 'ISRAELI',
  OTRA = 'OTRA',
}

export enum RazaPollo {
  ROSS_308 = 'ROSS_308',
  COBB_500 = 'COBB_500',
  HUBBARD = 'HUBBARD',
  ARBOR_ACRES = 'ARBOR_ACRES',
  OTRA = 'OTRA',
}

// Enums para estado de lotes
export enum EstadoLote {
  ACTIVO = 'ACTIVO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
  VENDIDO = 'VENDIDO',
  TRANSFERIDO = 'TRANSFERIDO', // Para lotes de levante transferidos a ponedoras
}

// Enums para subtipo de levante
export enum SubtipoLevante {
  LEVANTE_ENGORDE = 'LEVANTE_ENGORDE',       // Pollitos para engorde
  LEVANTE_PONEDORAS = 'LEVANTE_PONEDORAS',   // Pollitas para producción de huevos
}

// Enums para unidades de medida
export enum UnidadMedida {
  UNIDAD = 'Unidad',
  LIBRA = 'Libra',
  KILOGRAMO = 'Kilogramo',
  GALON = 'Galón',
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',
  GRAMO = 'Gramo',
}

// Tipo de Articulos
export enum TipoPrecioArticulo {
  FIJO = 'FIJO',
  VARIABLE = 'VARIABLE',
}

// Enums para ingresos
export enum TipoIngreso {
  VENTA_HUEVOS = 'VENTA_HUEVOS',
  VENTA_GALLINAS = 'VENTA_GALLINAS',
  OTRO = 'OTRO',
}

export enum TipoIngresoIsraeli {
  VENTA_POLLOS = 'VENTA_POLLOS',
  OTRO = 'OTRO',
}

// Enums para huevos
export enum Tamano {
  PEQUENO = 'PEQUEÑO',
  MEDIANO = 'MEDIANO',
  GRANDE = 'GRANDE',
  EXTRA_GRANDE = 'EXTRA_GRANDE',
}

export enum Calidad {
  PRIMERA = 'PRIMERA',
  SEGUNDA = 'SEGUNDA',
  TERCERA = 'TERCERA',
}