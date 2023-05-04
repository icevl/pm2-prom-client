import type { Registry } from "prom-client"
import type { Emit } from "./interfaces"
declare class MetricPromPm2 {
  private metrics
  incCounter(metricName: string): void
  setGauge(metricName: string, value: number): void
  startAgent(): void
  emit({ metricName, type, action, value }: Emit): void
  get registry(): Registry
  private getMetricByName
  private processBusEvent
  private processCounter
  private processGauge
}
declare const _default: MetricPromPm2
export default _default
//# sourceMappingURL=index.d.ts.map
