import pm2 from "pm2"
import { Counter, Gauge, register } from "prom-client"

import type { Registry } from "prom-client"

import { MetricType, Action } from "./interfaces"
import type { MetricData, MetricBusEvent, Emit, MetricBusEventPayload } from "./interfaces"

class MetricPromPm2 {
  private metrics: Array<MetricData> = []

  public incCounter(metricName: string): void {
    this.emit({ metricName, type: MetricType.Counter, action: Action.Increment })
  }

  public setGauge(metricName: string, value: number): void {
    this.emit({ metricName, type: MetricType.Gauge, action: Action.Set, value })
  }

  public startAgent() {
    pm2.launchBus((_: Error, pm2Bus: any) => {
      pm2Bus.on("process:msg", (event: MetricBusEvent) => {
        if (event?.data?.metric_name) this.processBusEvent(event.data)
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
    return register
  }

  private getMetricByName<T>(name: string): T | undefined {
    return this.metrics.find(metric => metric.name === name)?.instance as T | undefined
  }

  private processBusEvent(event: MetricBusEventPayload) {
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

    if (event.metric_action === Action.Increment) counterInstance.inc()
  }

  private processGauge(event: MetricBusEventPayload) {
    let gaugeInstance = this.getMetricByName<Gauge>(event.metric_name)

    if (!gaugeInstance) {
      gaugeInstance = new Gauge({ name: event.metric_name, help: event.metric_name })
      this.metrics.push({ name: event.metric_name, instance: gaugeInstance })
    }

    if (event.metric_action === Action.Set) gaugeInstance.set(Number(event.metric_value))
  }
}

export default new MetricPromPm2()
