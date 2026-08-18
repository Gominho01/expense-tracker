import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Sem testes escritos ainda (fase 0) — remover quando os primeiros testes forem adicionados.
    passWithNoTests: true,
  },
});
