import { BadRequest } from "./exceptions";

enum DataType {
  STRING = "STRING",
  INT = "INT",
  FLOAT = "FLOAT",
}

export function validateType(target: string | number, type: string) {
  switch (type) {
    case DataType.STRING:
      if (typeof target !== "string" || !target.trim()) {
        throw new BadRequest(`Target must be a non empty string, but got ${typeof target}`);
      }
      break;

    case DataType.INT:
      if (typeof target !== "number" || !Number.isInteger(target)) {
        throw new BadRequest(`Target must be an integer, but got ${typeof target}`);
      }
      break;

    case DataType.FLOAT:
      if (typeof target !== "number") {
        throw new BadRequest(`Target must be a float, but got ${typeof target}`);
      }
      break;

    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

