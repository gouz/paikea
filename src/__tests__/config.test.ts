import { describe, expect, it } from "bun:test";
import {
  dmrBaseUrl,
  resolveDmrHost,
  resolveDmrPort,
  resolveDmrScheme,
} from "../state/config";

describe("DMR scheme config", () => {
  it("defaults to http when unset or unknown", () => {
    expect(resolveDmrScheme(undefined)).toBe("http");
    expect(resolveDmrScheme("")).toBe("http");
    expect(resolveDmrScheme("ftp")).toBe("http");
  });

  it("honours https (case-insensitive)", () => {
    expect(resolveDmrScheme("https")).toBe("https");
    expect(resolveDmrScheme("HTTPS")).toBe("https");
  });
});

describe("DMR host config", () => {
  it("defaults to localhost when unset or blank", () => {
    expect(resolveDmrHost(undefined)).toBe("localhost");
    expect(resolveDmrHost("")).toBe("localhost");
    expect(resolveDmrHost("   ")).toBe("localhost");
  });

  it("honours a configured host and trims it", () => {
    expect(resolveDmrHost("192.168.1.50")).toBe("192.168.1.50");
    expect(resolveDmrHost("  dmr.local  ")).toBe("dmr.local");
  });
});

describe("DMR port config", () => {
  it("defaults to 12434 when unset", () => {
    expect(resolveDmrPort(undefined)).toBe(12434);
  });

  it("honours a valid configured port", () => {
    expect(resolveDmrPort(8080)).toBe(8080);
    expect(resolveDmrPort(1)).toBe(1);
    expect(resolveDmrPort(65535)).toBe(65535);
  });

  it("rejects out-of-range or non-integer ports", () => {
    expect(resolveDmrPort(0)).toBe(12434);
    expect(resolveDmrPort(-5)).toBe(12434);
    expect(resolveDmrPort(65536)).toBe(12434);
    expect(resolveDmrPort(80.5)).toBe(12434);
    expect(resolveDmrPort(Number.NaN)).toBe(12434);
  });
});

describe("DMR base URL", () => {
  it("builds the base URL from scheme, host and port", () => {
    expect(dmrBaseUrl("http", "localhost", 12434)).toBe(
      "http://localhost:12434/engines/v1",
    );
    expect(dmrBaseUrl("https", "dmr.example.com", 443)).toBe(
      "https://dmr.example.com:443/engines/v1",
    );
  });
});
