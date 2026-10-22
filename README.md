# Cloud Lab — Smart Lamp

Вебзастосунок для керування та моніторингу розумної лампи: режими освітлення, пресети, показники датчика та журнал команд. Backend реалізовано на Node.js/Express із MySQL; застосунок розгорнуто в AWS за допомогою Docker і Terraform. У хмарі працює режим симуляції (`ENABLE_ESP=false`).

## Public URLs

- **Application:** http://smart-lamp-alb-1092597596.eu-north-1.elb.amazonaws.com/
- **Health check:** http://smart-lamp-alb-1092597596.eu-north-1.elb.amazonaws.com/health
- **Swagger UI (OpenAPI):** http://smart-lamp-alb-1092597596.eu-north-1.elb.amazonaws.com/api-docs/

## Infrastructure

- AWS ECS Fargate та Amazon ECR
- Amazon RDS MySQL і AWS Secrets Manager
- Application Load Balancer (HTTP, порт 80)
- VPC, публічні й приватні підмережі, Security Groups
- AWS IAM та CloudWatch Logs
- Terraform, Docker і Docker Compose

## Project structure

```text
smart-lamp-vr2/
├── backend/
│   ├── server.js         # Express API
│   ├── db.js             # Підключення до MySQL
│   ├── init-db.js        # Ініціалізація таблиць
│   └── openapi.js        # Специфікація Swagger / OpenAPI
├── frontend/             # Вебінтерфейс
├── terraform/            # AWS: ECS, ECR, RDS, ALB, VPC, IAM, SG
├── init.sql              # Схема бази даних
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Local run

```bash
docker compose up -d --build
```

Локально: http://localhost:3000/ та http://localhost:3000/api-docs/.

## Deployment

**Деплой виконується вручну:** Docker-образ збирається локально, завантажується до Amazon ECR, після чого в `terraform/ecs.tf` оновлюється тег образу та виконується `terraform apply`. ECS Fargate запускає нову версію застосунку.

**Автоматичний CI/CD через GitHub Actions не налаштований** через обмеження AWS SCP на створення OIDC Provider. Публічні URL доступні, доки працює AWS-інфраструктура.
