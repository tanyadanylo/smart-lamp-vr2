variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  sensitive   = true
}

resource "aws_sns_topic" "smart_lamp_alerts" {
  name = "smart-lamp-alerts"
}

resource "aws_sns_topic_subscription" "smart_lamp_email" {
  topic_arn = aws_sns_topic.smart_lamp_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "smart_lamp_max_tasks" {
  alarm_name        = "smart-lamp-max-tasks"
  alarm_description = "Smart Lamp reached 3 running ECS tasks"

  namespace           = "ECS/ContainerInsights"
  metric_name         = "RunningTaskCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 2
  threshold           = 3
  comparison_operator = "GreaterThanOrEqualToThreshold"

  dimensions = {
    ClusterName = aws_ecs_cluster.smart_lamp.name
    ServiceName = aws_ecs_service.smart_lamp.name
  }

  treat_missing_data = "missing"

  alarm_actions = [
    aws_sns_topic.smart_lamp_alerts.arn
  ]

  ok_actions = [
    aws_sns_topic.smart_lamp_alerts.arn
  ]
}
