import type { Counter, Gauge, Registry, MetricObjectWithValues, MetricValue } from "prom-client"

export enum MetricType {
  Counter = "counter",
  Gauge = "gauge"
}

export enum Action {
  Increment,
  Decrement,
  Set
}

export type ProcessMetricData = MetricObjectWithValues<MetricValue<string>>

export interface MetricData {
  name: string
  instance: Counter | Gauge
}

export interface RegistryData {
  pid: number
  instance: Registry
}

export interface ProcessMetricState {
  [name: string]: {
    [pid: number]: ProcessMetricData
  }
}

export interface MetricBusEvent {
  data: MetricBusEventPayload
}

export interface ProcessMetric {
  name: string
  pid: number
  data: ProcessMetricData
}

export interface MetricBusEventPayload {
  metric_action: Action
  metric_type: MetricType
  metric_name: string
  metric_value?: string
  process_metric?: ProcessMetric
}

export interface Emit {
  metricName: string
  type: MetricType
  action: Action
  value?: string | number
}

export interface StartAgentOptions {
  defaultMetrics: boolean
}
