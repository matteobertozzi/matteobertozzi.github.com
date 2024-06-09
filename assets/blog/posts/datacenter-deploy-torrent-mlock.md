---
{
  "title": "Data-center deploy using torrent and mlock()",
  "timestamp": 1338654528000
}
---

Every morning you come in the office hoping that the nightly job that produce your blobs has finished... and if everything is fine, you spend the rest of the day hoping that none of the machines fails during transfer...
If you've a service that consume static data and you've more than one datacenter, probably everyday you face the problem of distributing data on all your service machines.

<img align="left" style="padding-right: 20px" src="${blog.baseUrl}/assets/blog/posts/imgs/datacenter-deploy-torrent-mlock-machines.png" />
Remember: 60MiB/sec * 1hour = ~210GiB

So what are the possible solution to transfer this blobs?
The first solution is copying all the data to one machine in each datacenter, and then each machine with the data is responsible to copy everything to all the other machines inside the datacenter.
Note: prefer rsync over scp, since if you lost connection with scp you need to retransfer everything from byte zero.

But what happens if a machine is down?
One of the solution is making all the machines part of this distribution, removing identities. Every machine is equal, every machine need to fetch these blobs. So, instead of using rsync from the "build" machine to the dist-host and from dist-host to service machines the "build" machine send an information "I've new data" and each machine starts fetching this data in a collaborative way (using bittorrent).

Each machine (build-machine/dist-hosts/services) need to run a torrent client, you can implement your [torrent](https://github.com/matteobertozzi/misc-common/blob/master/torrent/torrent.py) client in few lines of python using [libtorrent](http://libtorrent.com/). The idea is to fetch from a feed hosted on a build machine the latest blobs.torrent and start downloading. The build machine will be the initial seeder, but then every machine will be part of the data distribution. By writing your own [tracker](https://github.com/matteobertozzi/misc-common/blob/master/torrent/tracker.py) you can also tune your peer selection, preferring machines inside your datacenter or inside your rack to avoid cross-site latency.

Another important thing to remember, if your service rely on the buffer-cache to keep data in memory, is to tell to the system, to avoid evict your pages otherwise you'll probably see your service starting to slow down once you start to copy data to that machine... So make sure to mlock() your heavily used pages or if your blobs can be kept in memory use [vmtouch](http://hoytech.com/vmtouch/) to do the trick (vmtouch -l -d -m 64G blob) remember to add memlock entry for your user in /etc/security/limits.d/ otherwise you'll see mlock() fail.

You can find the source code of a simple command line bit-torrent client and a tracker at https://github.com/matteobertozzi/misc-common/tree/master/torrent.

