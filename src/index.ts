import pm2 from "pm2"
import { Counter, Gauge, register } from "prom-client"

import type { Registry } from "prom-client"

import { MetricType, Action } from "./interface"
import type { MetricData, MetricBusEvent, Emit, MetricBusEventPayload } from "./interface"

class MetricPromPm2 {
  private metrics: Array<MetricData> = []

  public incCounter(metricName: string): void {
    this.emit({ metricName, type: MetricType.Counter, action: Action.Increment })
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
