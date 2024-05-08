import Pino from "pino";

const pino = Pino.pino({
  transport: {
    target: "pino-pretty",
  },
  formatters: {
    bindings: (bindings) => {
      return { pid: bindings.pid, host: bindings.hostname };
    },
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  level: process.env.PINO_LOG_LEVEL || "info",
});
export default pino;
