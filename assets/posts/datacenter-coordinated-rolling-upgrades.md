---
{
  "title": "Data-center Rolling Upgrades coordinated by ZooKeeper",
  "timestamp": 1340533908000
}
---

Still playing around trying to improve the daily deploy work in the data-centers.

The idea is to replace a sequential/semi-manual process with something more automatic that don't need human intervention unless some failure happens.

Services and Deploy rules:
 * Services has dependencies (Service B depends on Service A), Deploy order matter!
 * You can't bring down all the machines at the same time!
 * One or more machine can be unreachable during the deploy (network problems, hw failures, ...).
 * Each machine need to be self-sufficient!

Must to Have (Monitoring)
 * Current service state of each machines (online/offline, service v1, v2)
 * Current "deploy" state (Ready to roll?)

<p align="center"><img src="${blog.baseUrl}/assets/posts/imgs/datacenter-coordinated-rolling-upgrades.png"></p>

The idea is quite simple, using ZooKeeper to keep track of each Service (A, B, ..., K) with the list of machines available (ephemeral znodes) and to keep track of te deploy state ("staging").
 * /dc/current: Contains a list of services with the list of online machines (and relative service version).
 * /dc/staging: Contains a list of services with the list of machines ready to roll.
 * /dc/deploy: Deploy order queue each node represent the service to upgrade.
When you're ready to deploy something new you can create the new znodes:
 * Add services to "staging" with the useful metadata (version, download path, ...)
 * Define a deploy "order" queue
Each service is notified about the new staging version and starts downloading (see "[data-center deploy using torrent and mlock()](./posts/datacenter-deploy-torrent-mlock)" post). Once the download is completed, the service register it self to the "staging" queue.

Now the tricky part is when can I start switching to the new version? The idea is to specify a quorum foreach service. The First machine in the "Staging" queue for the first service in the "Deploy" queue, looks for the quorum, and when is time shutdown it self and restart the new service. Once is done  adds it self to the "Current" list and remove it self from the staging queue.

And one by one each machine start upgrading it self, until the deploy queue is empty. If a machine is down during the deploy, the "Current" node is checked to find which version is the most popular, and the service will be started.
