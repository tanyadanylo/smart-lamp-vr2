resource "aws_security_group" "redis" {
  name_prefix = "smart-lamp-redis-"
  description = "Private Redis for Smart Lamp ECS tasks"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name    = "smart-lamp-redis-sg"
    Project = "smart-lamp"
  }
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_ecs" {
  security_group_id            = aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.ecs.id

  from_port   = 6379
  to_port     = 6379
  ip_protocol = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "redis_out" {
  security_group_id = aws_security_group.redis.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_service_discovery_private_dns_namespace" "smart_lamp" {
  name = "smart-lamp.internal"
  vpc  = module.vpc.vpc_id
}

resource "aws_service_discovery_service" "redis" {
  name = "redis"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.smart_lamp.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

}

resource "aws_ecs_task_definition" "redis" {
  family                   = "smart-lamp-redis"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = true

      portMappings = [
        {
          containerPort = 6379
          protocol      = "tcp"
        }
      ]

      command = [
        "redis-server",
        "--save", "",
        "--appendonly", "no",
        "--maxmemory", "128mb",
        "--maxmemory-policy", "allkeys-lru"
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.smart_lamp.name
          awslogs-region        = "eu-north-1"
          awslogs-stream-prefix = "redis"
        }
      }
    }
  ])

  tags = {
    Project = "smart-lamp"
  }
}

resource "aws_ecs_service" "redis" {
  name            = "smart-lamp-redis-service"
  cluster         = aws_ecs_cluster.smart_lamp.id
  task_definition = aws_ecs_task_definition.redis.arn

  launch_type      = "FARGATE"
  desired_count    = 1
  platform_version = "LATEST"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.redis.id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.redis.arn
  }

  tags = {
    Project = "smart-lamp"
  }
}


