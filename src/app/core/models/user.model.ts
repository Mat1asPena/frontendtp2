    export interface User {
    _id?: string;
    nombre: string;
    apellido: string;
    correo: string;
    nombreUsuario: string;
    fechaNacimiento?: string; // ISO
    descripcion?: string;
    imagenUrl?: string;
    habilitado?: boolean;
    perfil: 'usuario' | 'administrador';
}