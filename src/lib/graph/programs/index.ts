/**
 * Registro de programas de aresta por "type":
 *   solid / solidShort  → retângulo sólido (C usa espessura menor)
 *   dashed              → tracejado (A — alegação)
 *   dotted              → pontilhado (I — inferência)
 *   *Arrow              → mesma linha + cabeça de seta (arestas direcionadas)
 */
import type { EdgeProgramType } from "sigma/rendering";
import { EdgeRectangleProgram, createEdgeArrowHeadProgram, createEdgeCompoundProgram } from "sigma/rendering";
import { createPatternedEdgeProgram } from "./patterned";

export function createEdgeProgramClasses(): Record<string, EdgeProgramType> {
  const Dashed = createPatternedEdgeProgram({ dash: 7, gap: 5 });
  const Dotted = createPatternedEdgeProgram({ dash: 1.6, gap: 3.4 });
  const ArrowHead = createEdgeArrowHeadProgram({ lengthToThicknessRatio: 2.2, widenessToThicknessRatio: 1.8 });

  return {
    solid: EdgeRectangleProgram,
    solidShort: EdgeRectangleProgram,
    dashed: Dashed,
    dotted: Dotted,
    solidArrow: createEdgeCompoundProgram([EdgeRectangleProgram, ArrowHead]),
    solidShortArrow: createEdgeCompoundProgram([EdgeRectangleProgram, ArrowHead]),
    dashedArrow: createEdgeCompoundProgram([Dashed, ArrowHead]),
    dottedArrow: createEdgeCompoundProgram([Dotted, ArrowHead]),
  };
}
