# Ceph with Rook (Kubernetes)

This folder contains a practical path to integrate Ceph for distributed storage in Arturo Ecosystem.

## Why this is here

Ceph is production infrastructure and should not be forced into a single dev Docker Compose file.
Rook is the standard Kubernetes operator approach to deploy and manage Ceph clusters.

## Install order

1. Install Rook operator:
   kubectl apply -f https://raw.githubusercontent.com/rook/rook/v1.15.2/deploy/examples/crds.yaml
   kubectl apply -f https://raw.githubusercontent.com/rook/rook/v1.15.2/deploy/examples/common.yaml
   kubectl apply -f https://raw.githubusercontent.com/rook/rook/v1.15.2/deploy/examples/operator.yaml

2. Create the Ceph cluster:
   kubectl apply -f cluster.yaml

3. Create the toolbox:
   kubectl apply -f toolbox.yaml

4. Optional object gateway (S3 API):
   kubectl apply -f object-store.yaml

## Integration notes

- Use Ceph RBD for block volumes (database stateful workloads).
- Use CephFS for shared filesystem workloads.
- Use RGW (object-store.yaml) for object workloads. This can coexist with MinIO during migration.
