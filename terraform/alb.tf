
resource "aws_lb" "smart_lamp" {
  name               = "smart-lamp-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [aws_security_group.alb.id]
  subnets         = module.vpc.public_subnets

  tags = {
    Project = "smart-lamp"
  }
}

resource "aws_lb_target_group" "smart_lamp" {
  name        = "smart-lamp-targets"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id

  health_check {
    enabled             = true
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Project = "smart-lamp"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.smart_lamp.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.smart_lamp.arn
  }
}
