"use strict"
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, "__esModule", { value: true })
const pm2_1 = __importDefault(require("pm2"))
const prom_client_1 = require("prom-client")
const interfaces_1 = require("./interfaces")
class MetricPromPm2 {
  constructor() {
    this.metrics = []
  }
  incCounter(metricName) {
    this.emit({ metricName, type: interfaces_1.MetricType.Counter, action: interfaces_1.Action.Increment })
  }
  setGauge(metricName, value) {
    this.emit({ metricName, type: interfaces_1.MetricType.Gauge, action: interfaces_1.Action.Set, value })
  }
  startAgent() {
    pm2_1.default.launchBus((_, pm2Bus) => {
      pm2Bus.on("process:msg", event => {
        var _a
        if (
          (_a = event === null || event === void 0 ? void 0 : event.data) === null || _a === void 0
            ? void 0
            : _a.metric_name
        )
          this.processBusEvent(event.data)
      })
    })
  }
  emit({ metricName, type, action, value = undefined }) {
    if (!(process === null || process === void 0 ? void 0 : process.send)) return
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
  get registry() {
    return prom_client_1.register
  }
  getMetricByName(name) {
    var _a
    return (_a = this.metrics.find(metric => metric.name === name)) === null || _a === void 0 ? void 0 : _a.instance
  }
  processBusEvent(event) {
    switch (event.metric_type) {
      case interfaces_1.MetricType.Counter:
        this.processCounter(event)
        break
      case interfaces_1.MetricType.Gauge:
        this.processGauge(event)
        break
    }
  }
  processCounter(event) {
    let counterInstance = this.getMetricByName(event.metric_name)
    if (!counterInstance) {
      counterInstance = new prom_client_1.Counter({ name: event.metric_name, help: event.metric_name })
      this.metrics.push({ name: event.metric_name, instance: counterInstance })
    }
    if (event.metric_action === interfaces_1.Action.Increment) counterInstance.inc()
  }
  processGauge(event) {
    let gaugeInstance = this.getMetricByName(event.metric_name)
    if (!gaugeInstance) {
      gaugeInstance = new prom_client_1.Gauge({ name: event.metric_name, help: event.metric_name })
      this.metrics.push({ name: event.metric_name, instance: gaugeInstance })
    }
    if (event.metric_action === interfaces_1.Action.Set) gaugeInstance.set(Number(event.metric_value))
  }
}
exports.default = new MetricPromPm2()
//# sourceMappingURL=index.js.map
