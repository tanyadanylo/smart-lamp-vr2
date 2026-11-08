resource "aws_cloudwatch_dashboard" "smart_lamp" {
  dashboard_name = "SmartLamp-Monitoring"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 24
        height = 6

        properties = {
          title  = "1. ECS Tasks - Desired vs Running"
          region = "eu-north-1"
          period = 60
          stat   = "Average"
          metrics = [
            [
              "ECS/ContainerInsights",
              "DesiredTaskCount",
              "ClusterName", aws_ecs_cluster.smart_lamp.name,
              "ServiceName", aws_ecs_service.smart_lamp.name
            ],
            [
              "ECS/ContainerInsights",
              "RunningTaskCount",
              "ClusterName", aws_ecs_cluster.smart_lamp.name,
              "ServiceName", aws_ecs_service.smart_lamp.name
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6

        properties = {
          title  = "2. ECS CPU Utilization"
          region = "eu-north-1"
          period = 60
          stat   = "Average"
          metrics = [
            [
              "AWS/ECS",
              "CPUUtilization",
              "ClusterName", aws_ecs_cluster.smart_lamp.name,
              "ServiceName", aws_ecs_service.smart_lamp.name
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          title  = "3. HTTP Requests per Minute"
          region = "eu-north-1"
          period = 60
          stat   = "Sum"
          metrics = [
            [
              "AWS/ApplicationELB",
              "RequestCount",
              "LoadBalancer", aws_lb.smart_lamp.arn_suffix
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 24
        height = 6

        properties = {
          title  = "4. ALB Response Time p95"
          region = "eu-north-1"
          period = 60
          stat   = "p95"
          metrics = [
            [
              "AWS/ApplicationELB",
              "TargetResponseTime",
              "LoadBalancer", aws_lb.smart_lamp.arn_suffix
            ]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 24
        height = 6

        properties = {
          title  = "5. ALB Target HTTP 5xx Errors"
          region = "eu-north-1"
          period = 60
          stat   = "Sum"
          metrics = [
            [
              "AWS/ApplicationELB",
              "HTTPCode_Target_5XX_Count",
              "LoadBalancer", aws_lb.smart_lamp.arn_suffix,
              "TargetGroup", aws_lb_target_group.smart_lamp.arn_suffix
            ]
          ]
        }
      }
    ]
  })
}
