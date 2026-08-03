import type { PatternEntry } from '../../types/patterns';

import { martyrPattern } from './strategies/martyr';
import { silencedOnePattern } from './core/silenced-one';
import { overloadedOnePattern } from './strategies/overloaded-one';
import { unheldOnePattern } from './core/unheld-one';
import { controllerPattern } from './core/controller';
import { griefBearerPattern } from './core/grief-bearer';
import { invisibleOnePattern } from './core/invisible-one';
import { perfectionistPattern } from './strategies/perfectionist';
import { entangledOnePattern } from './core/entangled-one';
import { shameBearerPattern } from './core/shame-bearer';
import { overResponsibleOnePattern } from './strategies/over-responsible-one';
import { avoidantOnePattern } from './core/avoidant-one';
import { angerShieldPattern } from './strategies/anger-shield';
import { hypervigilantOnePattern } from './core/hypervigilant-one';
import { rescuerPattern } from './strategies/rescuer';

export const PATTERNS_DATA: PatternEntry[] = [
  martyrPattern,
  silencedOnePattern,
  overloadedOnePattern,
  unheldOnePattern,
  controllerPattern,
  griefBearerPattern,
  invisibleOnePattern,
  perfectionistPattern,
  entangledOnePattern,
  shameBearerPattern,
  overResponsibleOnePattern,
  avoidantOnePattern,
  angerShieldPattern,
  hypervigilantOnePattern,
  rescuerPattern,
];