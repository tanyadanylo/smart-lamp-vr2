module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "smart-lamp-vpc"
  cidr = "10.0.0.0/16"

  azs = [
    "eu-north-1a",
    "eu-north-1b"
  ]

  public_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24"
  ]

  private_subnets = [
    "10.0.11.0/24",
    "10.0.12.0/24"
  ]

  database_subnets = [
    "10.0.21.0/24",
    "10.0.22.0/24"
  ]

  enable_dns_support   = true
  enable_dns_hostnames = true

  enable_nat_gateway = true
  single_nat_gateway = true

  create_database_subnet_group           = true
  create_database_subnet_route_table     = true
  create_database_internet_gateway_route = false
  create_database_nat_gateway_route      = false

  tags = {
    Project     = "smart-lamp"
    Environment = "dev"
  }
}
