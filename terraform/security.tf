resource "aws_security_group" "alb" {
  name_prefix = "smart-lamp-alb-"
  description = "Security group for public ALB"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name = "smart-lamp-alb-sg"
  }
}

resource "aws_security_group" "ecs" {
  name_prefix = "smart-lamp-ecs-"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name = "smart-lamp-ecs-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "smart-lamp-rds-"
  description = "Security group for private MySQL"
  vpc_id      = module.vpc.vpc_id

  tags = {
    Name = "smart-lamp-rds-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id            = aws_security_group.ecs.id
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ecs" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "alb_out" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "ecs_out" {
  security_group_id = aws_security_group.ecs.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "rds_out" {
  security_group_id = aws_security_group.rds.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
