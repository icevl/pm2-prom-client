import type { Counter, Gauge } from "prom-client"
export declare enum MetricType {
  Counter = "counter",
  Gauge = "gauge"
}
export declare enum Action {
  Increment = 0,
  Set = 1
}
export interface MetricData {
  name: string
  instance: Counter | Gauge
}
export interface MetricBusEvent {
  data: MetricBusEventPayload
}
export interface MetricBusEventPayload {
  metric_action: Action
  metric_type: MetricType
  metric_name: string
  metric_value?: string
}
export interface Emit {
  metricName: string
  type: MetricType
  action: Action
  value?: string | number
}
//# sourceMappingURL=interfaces.d.ts.map
