import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'roleLabel', standalone: true })
export class RolePipe implements PipeTransform {
    transform(value: string): string {
        return value === 'administrador' ? '🛡️ Admin' : '👤 Usuario';
    }
}