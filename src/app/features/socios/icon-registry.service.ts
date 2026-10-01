import { Injectable } from '@angular/core';
import {
  CheckCircle,
  CalendarClock,
  PauseCircle,
  Ban,
  CircleSlash,
  Clock,
  Calendar,
  RotateCcw,
  Shield,
  XCircle,
  Eye,
  CreditCard,
  X,
  AlertCircle,
  Loader2,
  CheckCircle as CheckCircleIcon,
  CalendarClock as CalendarClockIcon,
  PauseCircle as PauseCircleIcon,
  Ban as BanIcon,
} from 'lucide-angular';
import { LucideIconData } from 'lucide-angular';

@Injectable({ providedIn: 'root' })
export class IconRegistry {
  private readonly map = new Map<string, LucideIconData>([
    ['check-circle', CheckCircle],
    ['calendar-clock', CalendarClock],
    ['pause-circle', PauseCircle],
    ['ban', Ban],
    ['circle-slash', CircleSlash],
    ['clock', Clock],
    ['calendar', Calendar],
    ['rotate-ccw', RotateCcw],
    ['shield', Shield],
    ['x-circle', XCircle],
    ['eye', Eye],
    ['credit-card', CreditCard],
    ['x', X],
    ['alert-circle', AlertCircle],
    ['loader2', Loader2],
  ]);

  get(name: string): LucideIconData | undefined {
    return this.map.get(name);
  }
}