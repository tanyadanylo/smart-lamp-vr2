resource "aws_appautoscaling_target" "smart_lamp" {
  min_capacity = 1
  max_capacity = 3

  resource_id = "service/${aws_ecs_cluster.smart_lamp.name}/${aws_ecs_service.smart_lamp.name}"

  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "smart_lamp_requests" {
  name        = "smart-lamp-requests-scaling"
  policy_type = "TargetTrackingScaling"

  resource_id        = aws_appautoscaling_target.smart_lamp.resource_id
  scalable_dimension = aws_appautoscaling_target.smart_lamp.scalable_dimension
  service_namespace  = aws_appautoscaling_target.smart_lamp.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 500.0
    scale_out_cooldown = 60
    scale_in_cooldown  = 180

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"

      resource_label = "${aws_lb.smart_lamp.arn_suffix}/${aws_lb_target_group.smart_lamp.arn_suffix}"
    }
  }
}
