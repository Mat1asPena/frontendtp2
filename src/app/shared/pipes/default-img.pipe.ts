import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'defaultImg', standalone: true })
export class DefaultImgPipe implements PipeTransform {
    transform(url: string | undefined): string {
        return url ? url : 'images/background.png';
    }
}