    export interface User {
    _id?: string;
    nombre: string;
    apellido: string;
    correo: string;
    nombreUsuario: string;
    fechaNacimiento?: string; // ISO
    descripcion?: string;
    rol?: 'usuario' | 'administrador';
    imagenUrl?: string;
    habilitado?: boolean;
}