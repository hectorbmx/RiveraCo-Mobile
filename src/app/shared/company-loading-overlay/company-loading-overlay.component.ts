import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-company-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-loading-overlay.component.html',
  styleUrls: ['./company-loading-overlay.component.scss'],
})
export class CompanyLoadingOverlayComponent {
  @Input() active = false;
  @Input() message = 'Cargando...';
}
