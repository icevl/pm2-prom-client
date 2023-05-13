import pm2 from "pm2"
import client, { Counter, Gauge, register } from "prom-client"

import type { Registry } from "prom-client"

import { MetricType, Action } from "./interface"
import type {
  MetricData,
  MetricBusEvent,
  Emit,
  MetricBusEventPayload,
  DefaultMetric,
  DefaultMetricsState,
  DefaultMetricsData,
  StartAgentOptions
} from "./interface"

class MetricPromPm2 {
  private metrics: Array<MetricData> = []
  private defaultMetrics: DefaultMetricsState = {}
  private defaultMetricsEnabled = true

  constructor() {
    this.collectDefaultMetricsStart()
  }

  public incCounter(metricName: string, value = 1): void {
    this.emit({ metricName, type: MetricType.Counter, action: Action.Increment, value })
  }

  public setGauge(metricName: string, value: number): void {
    this.emit({ metricName, type: MetricType.Gauge, action: Action.Set, value })
  }

  public incGauge(metricName: string, value: number): void {
    this.emit({ metricName, type: MetricType.Gauge, action: Action.Increment, value })
  }

  public decGauge(metricName: string, value: number): void {
    this.emit({ metricName, type: MetricType.Gauge, action: Action.Decrement, value })
  }

  public startAgent(options?: Partial<StartAgentOptions>) {
    this.defaultMetricsEnabled = options?.defaultMetrics ?? true

    pm2.launchBus((_: Error, pm2Bus: any) => {
      pm2Bus.on("process:msg", (event: MetricBusEvent) => {
        if (event?.data?.metric_name) this.processCustomMetric(event.data)
        if (event?.data?.default_metric) this.processDefaultMetric(event.data.default_metric)
      })
    })
  }

  public emit({ metricName, type, action, value = undefined }: Emit) {
    if (!process?.send) return

    process.send({
      type: "process:msg",
      data: {
        metric_name: metricName,
        metric_type: type,
        metric_action: action,
        ...(value !== undefined && { metric_value: value })
      }
    })
  }

  public get registry(): Registry {
    if (!this.defaultMetricsEnabled) return client.register
    return client.Registry.merge([...this.processesRegistries, register])
  }

  private get processesRegistries(): Array<Registry> {
    const registries: Array<Registry> = []
    Object.keys(this.defaultMetrics).forEach(processName => {
      const groupedProcessMetrics = Object.keys(this.defaultMetrics[processName]).reduce(
        (acc: Array<DefaultMetricsData>, pid) => [...acc, this.defaultMetrics[processName][Number(pid)]],
        []
      )
      const metricRegistry = client.AggregatorRegistry.aggregate(groupedProcessMetrics)
      metricRegistry.setDefaultLabels({ serviceApp: processName })
      registries.push(metricRegistry)
    })

    return registries
  }

  private collectDefaultMetricsStart() {
    const register = new client.Registry()
    const collectDefaultMetrics = client.collectDefaultMetrics
    collectDefaultMetrics({ prefix: this.processMetricPrefix, register })

    setInterval(async () => {
      if (!process?.send) return

      const data = await register.getMetricsAsJSON()
      process.send({
        type: "process:msg",
        data: {
          default_metric: {
            name: process.env.name,
            pid: Number(process.env.pm_id),
            data
          }
        }
      })
    }, 5000)
  }

  private processDefaultMetric(payload: DefaultMetric) {
    if (!this.defaultMetricsEnabled) return

    if (!this.defaultMetrics[payload.name]) this.defaultMetrics[payload.name] = {}
    this.defaultMetrics[payload.name][payload.pid] = payload.data
  }

  private get processMetricPrefix(): string {
    let prefix = process.env.name?.toLowerCase().replace("-", "_")
    if (prefix?.at(-1) !== "_") prefix += "_"
    return prefix || ""
  }

  private getMetricByName<T>(name: string): T | undefined {
    return this.metrics.find(metric => metric.name === name)?.instance as T | undefined
  }

  private processCustomMetric(event: MetricBusEventPayload) {
    switch (event.metric_type) {
      case MetricType.Counter:
        this.processCounter(event)
        break

      case MetricType.Gauge:
        this.processGauge(event)
        break
    }
  }

  private processCounter(event: MetricBusEventPayload) {
    let counterInstance = this.getMetricByName<Counter>(event.metric_name)

    if (!counterInstance) {
      counterInstance = new Counter({ name: event.metric_name, help: event.metric_name })
      this.metrics.push({ name: event.metric_name, instance: counterInstance })
    }

    if (event.metric_action === Action.Increment) counterInstance.inc(Number(event.metric_value))
  }

  private processGauge(event: MetricBusEventPayload) {
    let gaugeInstance = this.getMetricByName<Gauge>(event.metric_name)

    if (!gaugeInstance) {
      gaugeInstance = new Gauge({ name: event.metric_name, help: event.metric_name })
      this.metrics.push({ name: event.metric_name, instance: gaugeInstance })
    }

    this.updateGauge(gaugeInstance, event.metric_action, Number(event.metric_value))
  }

  private updateGauge(gaugeInstance: Gauge, action: Action, value: number): void {
    switch (action) {
      case Action.Set:
        gaugeInstance.set(value)
        break

      case Action.Increment:
        gaugeInstance.inc(value)
        break

      case Action.Decrement:
        gaugeInstance.dec(value)
        break
    }
  }
}

export default new MetricPromPm2()
