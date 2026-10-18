
resource "aws_ecs_cluster" "smart_lamp" {
  name = "smart-lamp-cluster"

  tags = {
    Project = "smart-lamp"
  }
}

resource "aws_cloudwatch_log_group" "smart_lamp" {
  name              = "/ecs/smart-lamp"
  retention_in_days = 7

  tags = {
    Project = "smart-lamp"
  }
}


resource "aws_ecs_task_definition" "smart_lamp" {
  family                   = "smart-lamp"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "smart-lamp"
      image     = "${aws_ecr_repository.smart_lamp.repository_url}:initial"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "DB_HOST", value = aws_db_instance.smart_lamp.address },
        { name = "DB_PORT", value = "3306" },
        { name = "DB_USER", value = "lamp_admin" },
        { name = "DB_NAME", value = "smart_lamp_db" },
        { name = "ENABLE_ESP", value = "false" }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = "${aws_db_instance.smart_lamp.master_user_secret[0].secret_arn}:password::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.smart_lamp.name
          awslogs-region        = "eu-north-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "smart_lamp" {
  name            = "smart-lamp-service"
  cluster         = aws_ecs_cluster.smart_lamp.id
  task_definition = aws_ecs_task_definition.smart_lamp.arn

  launch_type      = "FARGATE"
  desired_count    = 1
  platform_version = "LATEST"

  health_check_grace_period_seconds = 180

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.smart_lamp.arn
    container_name   = "smart-lamp"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution,
    aws_iam_role_policy.ecs_rds_secret
  ]

  tags = {
    Project = "smart-lamp"
  }
}
