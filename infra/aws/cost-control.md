# AWS Cost Control Checklist

Use AWS carefully. RDS, ElastiCache, ECS, NAT Gateways, and load balancers can create ongoing charges.

## Lowest-Cost Resume Setup

- Use one ECS cluster.
- Run one API task.
- Run one worker task only while testing.
- Use small RDS PostgreSQL instance.
- Use small ElastiCache Redis node.
- Avoid NAT Gateway for early experiments if possible.
- Set CloudWatch log retention to 7 days.
- Stop or delete RDS, ElastiCache, ECS services, and ALB when you are done testing.

## Delete Order

1. ECS services
2. ECS cluster
3. Load balancer and target groups
4. RDS database
5. ElastiCache cluster
6. ECR images/repositories
7. S3 bucket objects and bucket
8. CloudWatch log groups
9. Secrets Manager secrets

