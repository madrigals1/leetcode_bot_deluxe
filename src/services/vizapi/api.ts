import { VIZAPI_URL } from "@/constants";
import { VizApiNotAvailableError } from "@/errors";

export interface CompareField {
  name: string;
  value: string | number;
  bigger?: boolean;
}

export interface CompareSide {
  image: string;
  bio_fields: CompareField[];
  compare_fields: CompareField[];
}

export interface CompareData {
  left: CompareSide;
  right: CompareSide;
}

export interface SliceDataRow {
  sliceName: string;
  sliceValue: number;
  sliceColor: string;
}

export interface PieData {
  title: string;
  sliceName: string;
  sliceValue: string;
  sliceData: SliceDataRow[];
  chartArea: Record<string, unknown>;
  pieHole?: number;
  is3D?: boolean;
  width: number;
  height: number;
  fontSize?: number;
}

export interface BarData {
  data: unknown[][];
  options: { width: number; height: number; [key: string]: unknown };
}

export interface HealthResponse {
  status: string;
  uptime: number;
}

export interface LinkResponse {
  link: string;
}

export class VizApiService {
  static async health(): Promise<HealthResponse> {
    return VizApiService.fetch<HealthResponse>("/health");
  }

  static async generateTable(
    table: Record<string, unknown>[],
  ): Promise<LinkResponse> {
    return VizApiService.fetch<LinkResponse>("/table", {
      method: "POST",
      body: JSON.stringify({ table }),
    });
  }

  static async generateCompare(data: CompareData): Promise<LinkResponse> {
    return VizApiService.fetch<LinkResponse>("/compare", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generatePie(data: PieData): Promise<LinkResponse> {
    return VizApiService.fetch<LinkResponse>("/pie", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generateBar(data: BarData): Promise<LinkResponse> {
    return VizApiService.fetch<LinkResponse>("/bar", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  private static async fetch<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${VIZAPI_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } catch {
      throw new VizApiNotAvailableError();
    }

    if (!response.ok) {
      throw new Error(`VizAPI error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}
