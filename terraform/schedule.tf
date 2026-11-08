resource "aws_appautoscaling_scheduled_action" "smart_lamp_day" {
  name               = "smart-lamp-day"
  service_namespace  = aws_appautoscaling_target.smart_lamp.service_namespace
  resource_id        = aws_appautoscaling_target.smart_lamp.resource_id
  scalable_dimension = aws_appautoscaling_target.smart_lamp.scalable_dimension

  schedule = "cron(0 8 * * ? *)"
  timezone = "Europe/Kyiv"

  scalable_target_action {
    min_capacity = 2
    max_capacity = 3
  }
}

resource "aws_appautoscaling_scheduled_action" "smart_lamp_night" {
  name               = "smart-lamp-night"
  service_namespace  = aws_appautoscaling_target.smart_lamp.service_namespace
  resource_id        = aws_appautoscaling_target.smart_lamp.resource_id
  scalable_dimension = aws_appautoscaling_target.smart_lamp.scalable_dimension

  schedule = "cron(0 22 * * ? *)"
  timezone = "Europe/Kyiv"

  scalable_target_action {
    min_capacity = 1
    max_capacity = 3
  }
}