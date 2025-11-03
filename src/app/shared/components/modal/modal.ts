import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  @Input() title = '';
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  doClose() { this.close.emit(); }
  doConfirm() { this.confirm.emit(); this.doClose(); }
}
