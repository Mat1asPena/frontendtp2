import { Directive, ElementRef, HostListener } from '@angular/core';
@Directive({ selector: 'img[appImgError]', standalone: true })
export class ImgErrorDirective {
    constructor(private el: ElementRef) {}
    @HostListener('error') onError() {
        this.el.nativeElement.src = 'assets/default-avatar.png';
    }
}