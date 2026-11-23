variable "tenancy_ocid" {
  type = string
}

variable "compartment_ocid" {
  type = string
}

variable "user_ocid" {
  type = string
}

variable "fingerprint" {
  type = string
}

variable "private_key_path" {
  type = string
}

variable "region" {
  type = string
}

variable "availability_domain" {
  type    = string
  default = ""
}

variable "ssh_public_key" {
  type      = string
  sensitive = true
}

variable "instance_shape" {
  type    = string
  default = "VM.Standard.E5.Flex"
}

variable "instance_ocpus" {
  type    = number
  default = 1
}

variable "instance_memory_gb" {
  type    = number
  default = 2
}

variable "ssh_source_cidr" {
  type    = string
  default = "0.0.0.0/0"
}
