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
