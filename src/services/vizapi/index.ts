import { vizApiService } from "./api";

export class VizService {
  static vizapi = vizApiService;
}

export type {
  CompareField,
  CompareSide,
  CompareData,
  SliceDataRow,
  PieData,
  BarData,
  HealthResponse,
  LinkResponse,
} from "./api";
