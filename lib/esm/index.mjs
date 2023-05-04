import pm2 from "pm2";
import { Counter, Gauge, register } from "prom-client";
import { MetricType, Action } from "./interfaces";
class MetricPromPm2 {
    metrics = [];
    incCounter(metricName) {
        this.emit({ metricName, type: MetricType.Counter, action: Action.Increment });
    }
    setGauge(metricName, value) {
        this.emit({ metricName, type: MetricType.Gauge, action: Action.Set, value });
    }
    startAgent() {
        pm2.launchBus((_, pm2Bus) => {
            pm2Bus.on("process:msg", (event) => {
                if (event?.data?.metric_name)
                    this.processBusEvent(event.data);
            });
        });
    }
    emit({ metricName, type, action, value = undefined }) {
        if (!process?.send)
            return;
        process.send({
            type: "process:msg",
            data: {
                metric_name: metricName,
                metric_type: type,
                metric_action: action,
                ...(value !== undefined && { metric_value: value })
            }
        });
    }
    get registry() {
        return register;
    }
    getMetricByName(name) {
        return this.metrics.find(metric => metric.name === name)?.instance;
    }
    processBusEvent(event) {
        switch (event.metric_type) {
            case MetricType.Counter:
                this.processCounter(event);
                break;
            case MetricType.Gauge:
                this.processGauge(event);
                break;
        }
    }
    processCounter(event) {
        let counterInstance = this.getMetricByName(event.metric_name);
        if (!counterInstance) {
            counterInstance = new Counter({ name: event.metric_name, help: event.metric_name });
            this.metrics.push({ name: event.metric_name, instance: counterInstance });
        }
        if (event.metric_action === Action.Increment)
            counterInstance.inc();
    }
    processGauge(event) {
        let gaugeInstance = this.getMetricByName(event.metric_name);
        if (!gaugeInstance) {
            gaugeInstance = new Gauge({ name: event.metric_name, help: event.metric_name });
            this.metrics.push({ name: event.metric_name, instance: gaugeInstance });
        }
        if (event.metric_action === Action.Set)
            gaugeInstance.set(Number(event.metric_value));
    }
}
export default new MetricPromPm2();
