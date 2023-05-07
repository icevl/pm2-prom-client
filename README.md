# PM2 Prometheus metric

 Custom metrics collector (counter/gauge) from [pm2](https://pm2.keymetrics.io/) cluster processes using [prom-client](https://github.com/siimon/prom-client).


# Features

 - Increment counters
 - Set gauge value

# Quick Start

## Install
```bash
npm install pm2-prom-client
```

## Usage
In any process call metrics update methods:
```typescript
import metric from "pm2-prom-client"

metric.incCounter("my_counter")
metric.setGauge("my_gauge", 100)
```
Run the process for metric serving
Example:

**ecosystem.config.js:**
```json
{
  name: "Metric",
  script: "build/metric.js"
}
```

Serving plain text metrics **metric.ts:**
```typescript
import metric from "pm2-prom-client"

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

**Response example:**

```
# HELP my_counter my_counter
# TYPE my_counter counter
my_counter 123

# HELP my_gauge my_gauge
# TYPE my_gauge gauge
my_gauge 100
