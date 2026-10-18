data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "smart-lamp-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name               = "smart-lamp-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

data "aws_iam_policy_document" "ecs_rds_secret" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue"
    ]

    resources = [
      aws_db_instance.smart_lamp.master_user_secret[0].secret_arn
    ]
  }
}

resource "aws_iam_role_policy" "ecs_rds_secret" {
  name   = "smart-lamp-rds-secret-access"
  role   = aws_iam_role.ecs_execution.id
  policy = data.aws_iam_policy_document.ecs_rds_secret.json
}

