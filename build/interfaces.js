"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.Action = exports.MetricType = void 0
var MetricType
;(function (MetricType) {
  MetricType["Counter"] = "counter"
  MetricType["Gauge"] = "gauge"
})((MetricType = exports.MetricType || (exports.MetricType = {})))
var Action
;(function (Action) {
  Action[(Action["Increment"] = 0)] = "Increment"
  Action[(Action["Set"] = 1)] = "Set"
})((Action = exports.Action || (exports.Action = {})))
//# sourceMappingURL=interfaces.js.map
