# PM2 Prometheus metric

 Custom metrics collector (counter/gauge) from [pm2](https://pm2.keymetrics.io/) cluster processes using [prom-client](https://github.com/siimon/prom-client).


# Features

 - Default metrics from each process
 - Custom increment counters
 - Custom Set/inc/dec gauge value

# Quick Start

## Install
```bash
npm install pm2-prom-client
```

## Usage

In any pm2 process call metrics update methods:

```typescript
import metric from "pm2-prom-client"

metric.incCounter("my_counter") // by 1
metric.incCounter("my_counter", 10) // by 10
metric.setGauge("my_gauge", 100)
metric.incGauge("my_gauge", 2)
metric.decGauge("my_gauge", 1)
```

### Create a dedicated PM2 process that will consume and serving metrics from your applications

*ecosystem.config.js*
```json
{
  name: "Metric",
  script: "build/metric.js"
}
```

*metric.js*
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

metric.startAgent() // Start metric agent
startHttpServer() // Http serve
```

### Default metrics

Default metrics enabled by default. You can disable default metrics by

```typescript
metric.startAgent({ defaultMetrics: false })
```

### Response example:

```
# HELP my_counter my_counter
# TYPE my_counter counter
my_counter 123

# HELP my_gauge my_gauge
# TYPE my_gauge gauge
my_gauge 100
