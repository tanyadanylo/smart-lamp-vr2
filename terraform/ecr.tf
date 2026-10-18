resource "aws_ecr_repository" "smart_lamp" {
  name                 = "smart-lamp"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project = "smart-lamp"
  }
}


resource "aws_ecs_task_definition" "db_init" {
  family                   = "smart-lamp-db-init"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    merge(
      jsondecode(aws_ecs_task_definition.smart_lamp.container_definitions)[0],
      {
        name    = "smart-lamp-db-init"
        image   = "${aws_ecr_repository.smart_lamp.repository_url}:db-init"
        command = ["node", "backend/init-db.js"]
      }
    )
  ])
}
