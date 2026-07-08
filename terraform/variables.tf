variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Target AWS Region"
}

variable "instance_type" {
  type        = string
  default     = "t2.micro"
  description = "EC2 Instance Size"
}

variable "key_pair_name" {
  type        = string
  default     = "clouddeploy-ssh-key"
  description = "AWS Key pair registry name"
}

variable "public_key_path" {
  type        = string
  default     = "~/.ssh/id_rsa.pub"
  description = "Path to public SSH key file"
}

variable "ami_id" {
  type        = string
  default     = "ami-053b0d53c279acc90" # Ubuntu 22.04 LTS AMI in us-east-1
  description = "Ubuntu Machine Image ID"
}
