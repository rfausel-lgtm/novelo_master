import { describe, expect, it } from "vitest";
import { arestaMaisProxima, classeMaisForte, distanciaAoSegmento } from "./hit";

describe("distanciaAoSegmento", () => {
  it("mede a distância perpendicular a um segmento horizontal", () => {
    expect(distanciaAoSegmento({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
  });

  it("mede a distância perpendicular a um segmento vertical", () => {
    expect(distanciaAoSegmento({ x: -4, y: 7 }, { x: 0, y: 0 }, { x: 0, y: 10 })).toBe(4);
  });

  it("mede a distância perpendicular a um segmento diagonal", () => {
    /* A reta y = x; o ponto (0, 2) fica a 2/√2 dela. */
    expect(distanciaAoSegmento({ x: 0, y: 2 }, { x: -5, y: -5 }, { x: 5, y: 5 })).toBeCloseTo(
      Math.SQRT2,
      10,
    );
  });

  it("além das extremidades, vale a distância até a ponta mais próxima", () => {
    expect(distanciaAoSegmento({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
    expect(distanciaAoSegmento({ x: -3, y: -4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(5);
  });

  it("segmento degenerado vira distância ao ponto", () => {
    expect(distanciaAoSegmento({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
});

describe("arestaMaisProxima", () => {
  const h = { id: "h", a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
  const v = { id: "v", a: { x: 50, y: -50 }, b: { x: 50, y: 50 } };

  it("escolhe a mais próxima dentro da tolerância", () => {
    expect(arestaMaisProxima({ x: 20, y: 6 }, [h, v], 8)).toBe("h");
    expect(arestaMaisProxima({ x: 45, y: 30 }, [h, v], 8)).toBe("v");
  });

  it("devolve nulo quando nada está ao alcance", () => {
    expect(arestaMaisProxima({ x: 20, y: 9 }, [h, v], 8)).toBeNull();
    expect(arestaMaisProxima({ x: 20, y: 6 }, [], 8)).toBeNull();
  });

  it("não alcança a linha pelo prolongamento além da ponta", () => {
    expect(arestaMaisProxima({ x: 110, y: 0 }, [h], 8)).toBeNull();
    expect(arestaMaisProxima({ x: 106, y: 0 }, [h], 8)).toBe("h");
  });

  it("no empate, fica a que veio primeiro", () => {
    const h2 = { id: "h2", a: { x: 0, y: 10 }, b: { x: 100, y: 10 } };
    expect(arestaMaisProxima({ x: 20, y: 5 }, [h, h2], 8)).toBe("h");
    expect(arestaMaisProxima({ x: 20, y: 5 }, [h2, h], 8)).toBe("h2");
  });

  it("a aresta do contexto vence a mais próxima fora dele, desde que esteja ao alcance", () => {
    const contexto = { id: "ctx", a: { x: 0, y: 7 }, b: { x: 100, y: 7 }, prioridade: true };
    expect(arestaMaisProxima({ x: 20, y: 1 }, [h, contexto], 8)).toBe("ctx");
    /* Fora da tolerância, a prioridade não vale: fica a mais próxima entre as demais. */
    expect(arestaMaisProxima({ x: 20, y: -2 }, [h, contexto], 8)).toBe("h");
  });

  it("entre várias do contexto, escolhe a mais próxima delas", () => {
    const c1 = { id: "c1", a: { x: 0, y: 6 }, b: { x: 100, y: 6 }, prioridade: true };
    const c2 = { id: "c2", a: { x: 0, y: -3 }, b: { x: 100, y: -3 }, prioridade: true };
    expect(arestaMaisProxima({ x: 20, y: 0 }, [h, c1, c2], 8)).toBe("c2");
  });
});

describe("classeMaisForte", () => {
  it("ordena D > C > A > I", () => {
    expect(classeMaisForte("D", "C")).toBe(true);
    expect(classeMaisForte("C", "A")).toBe(true);
    expect(classeMaisForte("A", "I")).toBe(true);
    expect(classeMaisForte("I", "D")).toBe(false);
    expect(classeMaisForte("C", "C")).toBe(false);
  });
});
