output "public_ip" {
  value = oci_core_instance.app.public_ip
}

output "instance_ocid" {
  value = oci_core_instance.app.id
}

output "vcn_ocid" {
  value = oci_core_vcn.app.id
}

output "subnet_ocid" {
  value = oci_core_subnet.public.id
}
