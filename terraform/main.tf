terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Create Security Group for CloudDeploy Host
resource "aws_security_group" "clouddeploy_sg" {
  name        = "clouddeploy-security-group"
  description = "Enable access ports for CloudDeploy host and container nodes"

  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP Traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "App Containers Port Range"
    from_port   = 8000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "clouddeploy-security-group"
  }
}

# Key Pair association
resource "aws_key_pair" "clouddeploy_key" {
  key_name   = var.key_pair_name
  public_key = file(var.public_key_path)
}

# AWS EC2 Instance provision
resource "aws_instance" "clouddeploy_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.clouddeploy_key.key_name
  vpc_security_group_ids = [aws_security_group.clouddeploy_sg.id]

  # Provision shell commands on initial launch
  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update -y
              sudo apt-get install -y git curl nginx
              
              # Install Docker
              curl -fsSL https://get.docker.com -o get-docker.sh
              sudo sh get-docker.sh
              sudo usermod -aG docker ubuntu
              
              # Install Docker Compose
              sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              sudo chmod +x /usr/local/bin/docker-compose
              
              # Enable and start services
              sudo systemctl enable docker
              sudo systemctl start docker
              sudo systemctl enable nginx
              sudo systemctl start nginx
              EOF

  tags = {
    Name = "CloudDeploy-Runner-Host"
  }
}
