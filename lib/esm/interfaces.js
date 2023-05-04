export var MetricType
;(function (MetricType) {
  MetricType["Counter"] = "counter"
  MetricType["Gauge"] = "gauge"
})(MetricType || (MetricType = {}))
export var Action
;(function (Action) {
  Action[(Action["Increment"] = 0)] = "Increment"
  Action[(Action["Set"] = 1)] = "Set"
})(Action || (Action = {}))
