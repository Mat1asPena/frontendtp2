import { Directive, ElementRef, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
@Directive({ selector: '[appAdminOnly]', standalone: true })
export class AdminOnlyDirective implements OnInit {
    auth = inject(AuthService);
    constructor(private el: ElementRef) {}
    ngOnInit() {
        if (this.auth.getUser()?.perfil !== 'administrador') {
            this.el.nativeElement.style.display = 'none';
        }
    }
}