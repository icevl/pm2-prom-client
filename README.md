# PM2 Prometheus metric

 Custom metrics collector (counter/gauge) from [pm2](https://pm2.keymetrics.io/) cluster processes using [prom-client](https://github.com/siimon/prom-client).


# Features

 - Increment counters
 - Set gauge value

# Quick Start

## Install
```shell
npm install pm2-prom-client
```

## Usage
In any process call metrics update:
```
import metric from  "pm2-prom-client"

metric.incCounter("my_counter")
metric.setGauge("my_gauge", 100)
```
Run process for metric serving.
Example:

**ecosystem.config.js:**
```
{
	name: "Metric",
	script: "build/metric.js"
}
```

Serving plain metrics **metric.ts:**
```
import metric from  "pm2-prom-client"

const startHttpServer = () => {
  const requestListener = async (_: http.RequestOptions, res: http.ServerResponse) => {
    const metrics = await metric.registry.metrics() // Read as plain text
    res.writeHead(200)
    res.end(metrics)
  }
  
  const server = http.createServer(requestListener)
  server.listen(9999, "0.0.0.0")
}

metric.startAgent()
startHttpServer()
```
