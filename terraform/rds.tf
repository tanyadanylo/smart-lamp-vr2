
resource "aws_db_instance" "smart_lamp" {
  identifier = "smart-lamp-mysql"

  engine         = "mysql"
  engine_version = "8.4.11"
  instance_class = "db.t4g.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "smart_lamp_db"
  username = "lamp_admin"

  manage_master_user_password = true

  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az = false

  backup_retention_period = 1
  deletion_protection     = false
  skip_final_snapshot     = true

  tags = {
    Name        = "smart-lamp-mysql"
    Project     = "smart-lamp"
    Environment = "dev"
  }
}
