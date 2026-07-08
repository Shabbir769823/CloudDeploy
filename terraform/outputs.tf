output "instance_public_ip" {
  value       = aws_instance.clouddeploy_server.public_ip
  description = "Public IP Address of EC2 Runner Host"
}

output "instance_public_dns" {
  value       = aws_instance.clouddeploy_server.public_dns
  description = "Public DNS name of EC2 Runner Host"
}
