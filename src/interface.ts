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

export type DefaultMetricsData = MetricObjectWithValues<MetricValue<string>>

export interface MetricData {
  name: string
  instance: Counter | Gauge
}

export interface RegistryData {
  pid: number
  instance: Registry
}

export interface DefaultMetricsState {
  [name: string]: {
    [pid: number]: DefaultMetricsData
  }
}

export interface MetricBusEvent {
  data: MetricBusEventPayload
}

export interface DefaultMetric {
  name: string
  pid: number
  data: DefaultMetricsData
}

export interface MetricBusEventPayload {
  metric_action: Action
  metric_type: MetricType
  metric_name: string
  metric_value?: string
  default_metric?: DefaultMetric
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
